from fastapi.middleware.cors import CORSMiddleware
from database_handler import *
from fastapi import FastAPI
import requests
import datetime
import asyncio
import fxcmpy
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

msg_type_mapping = {
    1: '[+]',
    2: '[-]',
    3: '[.]'
}

pairs = ['AUDCAD', 'AUDCHF', 'AUDJPY', 'AUDNZD', 'AUDUSD', 'CADCHF', 'CADJPY', 'CHFJPY', 'EURAUD', 'EURCAD', 'EURCHF', 'EURGBP', 'EURJPY', 'EURNZD', 'EURUSD', 'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPJPY', 'GBPNZD', 'GBPUSD', 'NZDCAD', 'NZDCHF', 'NZDJPY', 'NZDUSD', 'USDCAD', 'USDCHF', 'USDJPY']
pips = {pair:0.01 if pair[3:] == 'JPY' else 0.0001 for pair in pairs}
prices = {pair:0 for pair in pairs}

BASE_URL = 'https://stat-arbitrage-dashboard.onrender.com/'

TOKEN = 'ff6efd1deca512f4db9d4e0594040b083ddf3cda'
CON = None
PREV_CON_TIME = 0
CON_INTERVAL = 60 * 30 # can only request to connect every 30 mins

PREV_DB_UPDATE_TIME = 0
DB_UPDATE_INTERVAL = 60 * 60 # add new record to database every 1 hour

PRICE_UPDATE_TIME = 0

FXCM_CANDLE_PERIOD = 'H1'
QUERY_INTERVAL = 60 * 5 # query for pice updates every 5 mins

last_db_record = find_last(f'prices_{num_collections()}')
print(last_db_record)
if last_db_record:
    PREV_DB_UPDATE_TIME = int(last_db_record['datetime'])

    del last_db_record['datetime']
    prices = last_db_record
    for pair in pairs:
        prices[pair] *= pips[pair]


# +------------------+
# | Helper Functions |
# +------------------+

def epoch_to_datetime(epoch):
    if type(epoch) == str:
        epoch = int(epoch)

    return datetime.datetime.fromtimestamp(epoch).strftime('%d-%m-%Y %H:%M')

def print_log(msg_content, msg_type):
    print(f'{epoch_to_datetime(time.time())} [{msg_type_mapping[msg_type]}] {msg_content}')

def connect():
    global PREV_CON_TIME, CON
    if time.time() - PREV_CON_TIME > CON_INTERVAL:
        PREV_CON_TIME = time.time()
    
        print_log('Attempting to connect ...', 3)
        try:
            CON = fxcmpy.fxcmpy(access_token=TOKEN, log_level='error')
            print_log('Connected to FXCM server', 1)
            return True
        except Exception as e:
            print_log('Can\'t connect to FXCM server', 2)

    return False


def fetch_price(symbol: str, period):
    if not CON:
        connected = connect()
        if not connected:
            return 0

    try:
        prices[symbol] = round(float(CON.get_candles(symbol[:3] + '/' + symbol[-3:], period, number=1)['bidclose']), 6)
    except:
        pass

    return prices[symbol]

# +-----------------------+
# | Multi-Threading Query |
# +-----------------------+

# 1) update prices in every recursive call
# 2) if DB_UPDATE_INTERVAL has passed, insert record to DB as well & update PREV_DB_UPDATE_TIME
# 3) recursion after QUERY_INTERVAL 
async def query_interval():
    global PREV_DB_UPDATE_TIME, PRICE_UPDATE_TIME
    prices_copy = None

    while True:
        print_log('New Interval', 3)
        
        if time.time() // DB_UPDATE_INTERVAL > PREV_DB_UPDATE_TIME // DB_UPDATE_INTERVAL:
            print_log('Updating prices ...', 3)
            PREV_DB_UPDATE_TIME = int(time.time()) // DB_UPDATE_INTERVAL * DB_UPDATE_INTERVAL

            for pair in pips:
                fetch_price(pair, FXCM_CANDLE_PERIOD)
            
            prices_copy = prices.copy()
            for pair in prices_copy:
                prices_copy[pair] /= pips[pair]
            prices_copy['datetime'] = PREV_DB_UPDATE_TIME

            insert_doc(prices_copy)
            print_log('Inserted', 1)
        
        PRICE_UPDATE_TIME = int(time.time())
        for pair in pips:
            fetch_price(pair, 'm1') # get current price

        response = requests.get(BASE_URL)
        print_log('(Pinged) STATUS CODE' + response.status_code, 3)
        
        await asyncio.sleep(QUERY_INTERVAL)

# +---------------+
# | API Endpoints |
# +---------------+

@app.get('/')
def read_root():
    return {
        'https://stat-arbitrage-dashboard.onrender.com/': 'API base URL',
        '/price/?symbol=': 'Get price of 1 pair',
        '/historical/chain/?n=': 'Get historical prices in chain query fashion starting from index n',
        '/historical/last/?n=': 'Get last n historical prices',
        '/prices/': 'Get all prices',
        '/reconnect/': 'Reconnect to FXCM server',
        '/last-update/': 'Get last query & connection datetimes',
        '/close/': 'Terminate connection with FXCM server'
    }

@app.get('/price/')
async def get_price(symbol: str):
    return await fetch_price(symbol)

@app.get('/prices/')
def get_prices():
    return prices

@app.get('/historical/chain/')
def get_chain_historical_prices(n: int = 1):
    return {'prices': find_all(f'prices_{n}'), 'next': n+1 if n<num_collections() else 0}

@app.get('/historical/last/')
def get_last_historical_prices(n: int = 1000):
    res = []
    start = num_collections()
    while start and n:
        docs = find_all(f'prices_{start}')[-1*n:]
        res = docs + res
        start -= 1
        n -= len(docs)
        
    return {'prices':res}

@app.get('/reconnect/')
async def attempt_reconnect():
    global PREV_CON_TIME

    PREV_CON_TIME = 0
    return {'Status': connect()}

@app.get('/last-update/')
async def get_last_connect():
    return {
        'Last price update': epoch_to_datetime(PRICE_UPDATE_TIME),
        'Last database update': epoch_to_datetime(PREV_DB_UPDATE_TIME),
        'Last FXCM connection attempt': epoch_to_datetime(PREV_CON_TIME),
    }

@app.get('/close/')
def close():
    CON.close()
    return {'Connection': 'Terminated'}

@app.on_event('startup')
async def schedule_interval():
    print_log('Starting background loop', 3)
    loop = asyncio.get_event_loop()
    loop.create_task(query_interval())

# uvicorn main:app --host 0.0.0.0 --port 10000
# uvicorn main:app --reload


print('+-------+')
print('| START |')
print('+-------+')
print('RECURSION INTERVAL      \t', QUERY_INTERVAL, 'secs')
print('DATABASE UPDATE INTERVAL\t', DB_UPDATE_INTERVAL, 'secs')
print('PREV DATABASE UPDATE    \t', epoch_to_datetime(PREV_DB_UPDATE_TIME))
print()

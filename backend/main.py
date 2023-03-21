from fastapi.middleware.cors import CORSMiddleware
from database_handler import *
from fastapi import FastAPI
import datetime
import asyncio
import fxcmpy
import time
import os

load_dotenv(find_dotenv())

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

# for logging purposes
MSG_TYPE_MAPPING = {
    1: '+',
    2: '-',
    3: '.'
}

PAIRS = ['AUDCAD', 'AUDCHF', 'AUDJPY', 'AUDNZD', 'AUDUSD', 'CADCHF', 'CADJPY', 'CHFJPY', 'EURAUD', 'EURCAD', 'EURCHF', 'EURGBP', 'EURJPY', 'EURNZD', 'EURUSD', 'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPJPY', 'GBPNZD', 'GBPUSD', 'NZDCAD', 'NZDCHF', 'NZDJPY', 'NZDUSD', 'USDCAD', 'USDCHF', 'USDJPY']
PIPS = {pair:0.01 if pair[3:] == 'JPY' else 0.0001 for pair in PAIRS}
prices = {pair:0 for pair in PAIRS} # store current prices in memory

BASE_URL = 'https://stat-arb-backend.onrender.com/'

TOKEN = password = os.environ.get('FXCM_TOKEN')
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
    for pair in PAIRS:
        prices[pair] *= PIPS[pair]


# +------------------+
# | Helper Functions |
# +------------------+

def epoch_to_datetime(epoch: int) -> str:
    '''
    Convert unix timestamp to dd-mm-YYYY HH-MM format

    :param int epoch: Unix timestamp
    :return: Datestring in dd-mm-YYYY HH-MM format
    :rtype: str
    '''
    return datetime.datetime.fromtimestamp(epoch).strftime('%d-%m-%Y %H:%M')

def print_log(msg_content: str, msg_type: int):
    '''
    Log a message
    '''
    print(f'{epoch_to_datetime(time.time())} [{MSG_TYPE_MAPPING[msg_type]}] {msg_content}')

def connect() -> bool:
    '''
    Connect to FXCM websocket if previous connection attempt is more than CON_INTERVAL seconds before

    :return: True if connected successfully, else False
    :rtype: bool
    '''
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

def fetch_price(symbol: str, period: str) -> float:
    '''
    Query for price of a symbol in specified timeframe and update price of symbol in memory

    :param str symbol: Symbol/ticker of financial instrument
    :param str period: Timeframe of candlestick
    :return: Price of symbol in specified timeframe
    :rtype: float
    '''
    if not CON:
        connected = connect()
        if not connected:
            return 0

    try:
        prices[symbol] = round(float(CON.get_candles(symbol[:3] + '/' + symbol[-3:], period, number=1)['bidclose']), 6)
    except:
        pass

    return prices[symbol]

async def query_interval():
    '''
    Every QUERY_INTERVAL seconds, update prices of all symbols in PAIRS in server memory.
    If more than DB_UPDATE_INTERVAL seconds has passed since PREV_DB_UPDATE_TIME, insert new prices into database
    '''
    global PREV_DB_UPDATE_TIME, PRICE_UPDATE_TIME
    prices_copy = None

    while True:
        print_log('New Interval', 3)
        
        # more than DB_UPDATE_INTERVAL seconds has passed since PREV_DB_UPDATE_TIME
        if time.time() // DB_UPDATE_INTERVAL > PREV_DB_UPDATE_TIME // DB_UPDATE_INTERVAL:
            print_log('Updating prices ...', 3)
            PREV_DB_UPDATE_TIME = int(time.time()) // DB_UPDATE_INTERVAL * DB_UPDATE_INTERVAL

            # fetch prices of previous candlesticks
            for pair in PIPS:
                fetch_price(pair, FXCM_CANDLE_PERIOD)
            
            prices_copy = prices.copy()
            for pair in prices_copy:
                prices_copy[pair] /= PIPS[pair]
            prices_copy['datetime'] = PREV_DB_UPDATE_TIME

            # insert new prices into database
            # insert_doc(prices_copy)
            # print_log('Inserted', 1)
        
        PRICE_UPDATE_TIME = int(time.time())
        for pair in PAIRS:
            fetch_price(pair, 'm1') # get current price
        
        await asyncio.sleep(QUERY_INTERVAL)

# +---------------+
# | API Endpoints |
# +---------------+

@app.get('/')
def root() -> dict:
    '''
    Display all API endpoints at root of app

    :return: All API endpoints
    :rtype: str
    '''
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
async def get_price(symbol: str) -> float:
    '''
    Return price of symbol

    :param str symbol: Symbol/ticker of instrument to query for
    :return: Price of symbol
    :rtype: float
    '''
    return await fetch_price(symbol)

@app.get('/prices/')
def get_prices() -> dict:
    '''
    Return prices of all pairs in last period

    :return: Prices of all pairs in last period
    :rtype: dict
    '''
    return prices

@app.get('/historical/chain/')
def get_chain_historical_prices(n: int = 1) -> dict:
    '''
    Return all historical prices in chunks of 10,000 (size of each collection)

    :param int n: Database collection ID
    :return: Historical prices in prices_{n} collection
    :rtype: dict
    '''
    return {'prices': find_all(f'prices_{n}'), 'next': n+1 if n<num_collections() else 0}

@app.get('/historical/last/')
def get_last_historical_prices(n: int = 1000) -> list[dict]:
    '''
    Return last n closing prices
    
    :param int n: Last n periods
    :return: Last n closing prices
    :rtype: list[dict]
    '''
    res = []
    start = num_collections()
    while start and n:
        docs = find_all(f'prices_{start}')[-1*n:]
        res = docs + res
        start -= 1
        n -= len(docs)
        
    return res

@app.get('/reconnect/')
async def attempt_reconnect() -> dict:
    '''
    Attempt to connect to FXCM websocket

    :return: Object containing FXCM websocket connection status
    :rtype: dict
    '''
    global PREV_CON_TIME

    PREV_CON_TIME = 0
    return {'Status': connect()}

@app.get('/last-update/')
async def get_last_connect() -> dict:
    '''
    Show datetimes of last update attempts for price, database and FXCM connection

    :return: Object showing datetime of last price update, last database update and last FXCM connection attempt
    :rtype: dict
    '''
    return {
        'Last price update': epoch_to_datetime(PRICE_UPDATE_TIME),
        'Last database update': epoch_to_datetime(PREV_DB_UPDATE_TIME),
        'Last FXCM connection attempt': epoch_to_datetime(PREV_CON_TIME),
    }

@app.on_event('startup')
async def schedule_interval():
    '''
    On app startup, schedule async background loop that continually queries for new prices every QUERY_INTERVAL seconds.
    Insert new price data to database every DB_UPDATE_INTERVAL seconds
    '''
    print_log('Starting background loop', 3)
    loop = asyncio.get_event_loop()
    loop.create_task(query_interval())


print('+-------+')
print('| START |')
print('+-------+')
print('RECURSION INTERVAL      \t', QUERY_INTERVAL, 'secs')
print('DATABASE UPDATE INTERVAL\t', DB_UPDATE_INTERVAL, 'secs')
print('PREV DATABASE UPDATE    \t', epoch_to_datetime(PREV_DB_UPDATE_TIME))
print()

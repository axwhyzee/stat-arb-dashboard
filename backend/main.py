from fastapi.middleware.cors import CORSMiddleware
from database_handler import *
from fastapi import FastAPI
import threading
import datetime
import fxcmpy
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

pairs = ['AUDCAD', 'AUDCHF', 'AUDJPY', 'AUDNZD', 'AUDUSD', 'CADCHF', 'CADJPY', 'CHFJPY', 'EURAUD', 'EURCAD', 'EURCHF', 'EURGBP', 'EURJPY', 'EURNZD', 'EURUSD', 'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPJPY', 'GBPNZD', 'GBPUSD', 'NZDCAD', 'NZDCHF', 'NZDJPY', 'NZDUSD', 'USDCAD', 'USDCHF', 'USDJPY']
pips = {pair:0.01 if pair[3:] == 'JPY' else 0.0001 for pair in pairs}
prices = {pair:0 for pair in pairs}

TOKEN = 'ff6efd1deca512f4db9d4e0594040b083ddf3cda'
CON = None
PREV_CON_TIME = 0
CON_INTERVAL = 60 * 30 # can only request to connect every 30 mins

FXCM_CANDLE_PERIOD = 'H1'
PREV_QUERY_TIME = 0
QUERY_INTERVAL = 60 * 60 # number of seconds in h1

last_db_record = find_last()
if last_db_record:
    PREV_QUERY_TIME = int(last_db_record['datetime'])

    del last_db_record['datetime']
    prices = last_db_record


# +------------------+
# | Helper Functions |
# +------------------+

def epoch_to_datetime(epoch):
    if type(epoch) == str:
        epoch = int(epoch)

    return datetime.datetime.fromtimestamp(epoch).strftime('%Y-%m-%d %H:%M')


def connect():
    global PREV_CON_TIME, CON
    if time.time() - PREV_CON_TIME > CON_INTERVAL:
        PREV_CON_TIME = time.time()
    
        print('[.] Attempting to connect ...')
        try:
            CON = fxcmpy.fxcmpy(access_token=TOKEN, log_level='error')
            print('[+] Connected to FXCM server')
            return True
        except Exception as e:
            print('Can\'t connect to FXCM server', e)
            return False

    return False


def fetch_price(symbol: str):
    if not CON:
        connected = connect()
        if not connected:
            return 0

    try:
        prices[symbol] = round(float(CON.get_candles(symbol[:3] + '/' + symbol[-3:], period=FXCM_CANDLE_PERIOD, number=1)['bidclose']), 6)
    except:
        pass

    return prices[symbol]


# +---------------+
# | API Endpoints |
# +---------------+

@app.get('/')
def read_root():
    return {
        'API base URL': 'https://stat-arbitrage-dashboard.onrender.com/',
        'Get price of 1 pair': '/price/?symbol=',
        'Get historical prices': '/historical/',
        'Get all prices': '/all/',
        'Reconnect to FXCM server': '/reconnect/',
        'Get last query & connection datetimes': '/last/',
        'Terminate connection with FXCM server': '/close/'
    }


@app.get('/price/')
async def get_price(symbol: str):
    return await fetch_price(symbol)


@app.get('/all/')
def get_all_prices():
    return prices


@app.get('/historical/')
def get_historical_prices():
    return find_all()[-100:]

@app.get('/reconnect/')
async def attempt_reconnect():
    global PREV_CON_TIME

    PREV_CON_TIME = 0
    return {'Status': connect()}


@app.get('/last/')
async def get_last_connect():
    return {
        'Last query': datetime.datetime.strftime(datetime.datetime.utcfromtimestamp(PREV_QUERY_TIME), '%d-%m-%Y %H:%M'),
        'Last connection attempt': datetime.datetime.strftime(datetime.datetime.utcfromtimestamp(PREV_CON_TIME), '%d-%m-%Y %H:%M')
    }
    

@app.get('/close/')
def close():
    CON.close()
    return {'Connection': 'Terminated'}


# uvicorn main:app --host 0.0.0.0 --port 10000
# uvicorn main:app --reload

# http://127.0.0.1:8000/spread/?pairs=AUDUSD&pairs=CADCHF&betas=1&betas=-4.0686013955488303


# +-----------------------+
# | Multi-Threading Query |
# +-----------------------+

def set_interval():
    global PREV_QUERY_TIME

    prices_copy = None
    print('[INTERVAL]', epoch_to_datetime(time.time()))
    
    if time.time() // QUERY_INTERVAL > PREV_QUERY_TIME // QUERY_INTERVAL:
        print('Updating prices ...')
        PREV_QUERY_TIME += QUERY_INTERVAL
        for pair in pips:
            fetch_price(pair)

        prices_copy = prices.copy()
        prices_copy['datetime'] = str(PREV_QUERY_TIME)

        print('Inserted ID:', insert_doc(prices_copy))
        prune()

    time.sleep(QUERY_INTERVAL // 2)
    set_interval()

# start thread
print('+-----------------+')
print('| MULTI-THREADING |')
print('+-----------------+')
print('RECURSION INTERVAL\t', QUERY_INTERVAL // 2, 'secs')
print('REQUEST INTERVAL  \t', QUERY_INTERVAL, 'secs')
print('PREV_QUERY_TIME   \t', epoch_to_datetime(PREV_QUERY_TIME))
print()
t = threading.Thread(target=set_interval)
t.start()

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Query
from typing import List, Union
import numpy as np
import datetime
import fxcmpy
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    # allow_credentials=True, # if credentials allowed, then cannot allow all origins
    allow_methods=['*'],
    allow_headers=['*'],
)

pips = {
    'AUDCAD': 0.0001,
    'AUDCHF': 0.0001,
    'AUDJPY': 0.01,
    'AUDNZD': 0.0001,
    'AUDUSD': 0.0001,
    'CADCHF': 0.0001,
    'CADJPY': 0.01,
    'CHFJPY': 0.01,
    'EURAUD': 0.0001,
    'EURCAD': 0.0001,
    'EURCHF': 0.0001,
    'EURGBP': 0.0001,
    'EURJPY': 0.01,
    'EURNZD': 0.0001,
    'EURUSD': 0.0001,
    'GBPAUD': 0.0001,
    'GBPCAD': 0.0001,
    'GBPCHF': 0.0001,
    'GBPJPY': 0.01,
    'GBPNZD': 0.0001,
    'GBPUSD': 0.0001,
    'NZDCAD': 0.0001,
    'NZDCHF': 0.0001,
    'NZDJPY': 0.01,
    'NZDUSD': 0.0001,
    'USDCAD': 0.0001,
    'USDCHF': 0.0001,
    'USDJPY': 0.01
}
prices = {'AUDCAD':0,'AUDCHF':0,'AUDJPY':0,'AUDNZD':0,'AUDUSD':0,'CADCHF':0,'CADJPY':0,'CHFJPY':0,'EURAUD':0,'EURCAD':0,'EURCHF':0,'EURGBP':0,'EURJPY':0,'EURNZD':0,'EURUSD':0,'GBPAUD':0,'GBPCAD':0,'GBPCHF':0,'GBPJPY':0,'GBPNZD':0,'GBPUSD':0,'NZDCAD':0,'NZDCHF':0,'NZDJPY':0,'NZDUSD':0,'USDCAD':0,'USDCHF':0,'USDJPY':0}

TOKEN = 'ff6efd1deca512f4db9d4e0594040b083ddf3cda'
CON = None
PREV_CON_TIME = 0
CON_INTERVAL = 60 * 30 # can only request to connect every 30 mins

PREV_QUERY_TIME = 0
QUERY_INTERVAL = 60 * 5 # will only update FXCM price data every 5 mins

def connect():
    global PREV_CON_TIME, CON
    if time.time() - PREV_CON_TIME > CON_INTERVAL:
        PREV_CON_TIME = time.time()
    
        print('[.] Establishing connection')
        try:
            CON = fxcmpy.fxcmpy(access_token=TOKEN, log_level='error')
            print('[+] Connected')
            return True
        except Exception as e:
            print('Can\'t connect to FXCM server', e)
            return False

    return False


def fetch_price(symbol: str):
    global PREV_QUERY_TIME
    if not CON:
        connected = connect()
        if not connected:
            return 0

    try:
        prices[symbol] = float(CON.get_candles(symbol[:3] + '/' + symbol[-3:], period='m1', number=1)['bidclose'])
    except:
        pass

    return prices[symbol]


@app.get('/')
def read_root():
    return '/spread/?pairs=AUDUSD&pairs=CADCHF&betas=1&betas=-4.0686013955488303'


@app.get('/spread/')
def get_spread(pairs: Union[List[str], None] = Query(default=None),  
                     betas: Union[List[float], None] = Query(default=None)):
    
    response = {}

    prices = []
    for pair in pairs:
        price = fetch_price(pair)
        prices.append(price/pips[pair])

    betas = np.array(betas)
    spread = np.dot(betas, np.array(prices).T)

    response['datetime'] = time.strftime("%H:%M:%S", time.localtime())
    response['Y'] = pairs[0]
    response['X'] = pairs[1:]

    for i in range(len(prices)):
        response[pairs[i]] = round(prices[i], 2)

    response['betas'] = [1,] + list(betas[1:])
    response['spread'] = spread
    
    return response

@app.get('/price/')
async def get_price(symbol: str):
    return await fetch_price(symbol)

@app.get('/all/')
def get_all_prices():
    global PREV_QUERY_TIME
    
    if time.time() - PREV_QUERY_TIME > QUERY_INTERVAL:
        for pair in pips:
            fetch_price(pair)

        PREV_QUERY_TIME = int(time.time())
        
    return prices

@app.get('/reconnect/')
async def attempt_reconnect():
    global PREV_CON_TIME

    PREV_CON_TIME = 0
    return {'Status': connect()}


@app.get('/connect/last')
async def get_last_connect():
    return datetime.datetime.strftime(datetime.datetime.utcfromtimestamp(PREV_QUERY_TIME), '%d-%m-%Y %H:%M')
    

@app.get('/close/')
def close():
    CON.close()
    return {'Response': 'Connection closed'}


# uvicorn main:app --host 0.0.0.0 --port 10000
# uvicorn main:app --reload

# http://127.0.0.1:8000/spread/?pairs=AUDUSD&pairs=CADCHF&betas=1&betas=-4.0686013955488303

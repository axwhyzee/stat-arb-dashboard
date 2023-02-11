from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Query
from typing import List, Union
import numpy as np
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

print('[.] Establishing connection')
TOKEN = 'ff6efd1deca512f4db9d4e0594040b083ddf3cda'
CON = None


async def connect():
    try:
        CON = await fxcmpy.fxcmpy(access_token=TOKEN, log_level='error')
        print('[+] Connected')
    except:
        print('Can\'t connect to FXCM server')


async def get_price(symbol: str):
    if not CON:
        return 0

    if symbol[3] != '/':
        symbol = symbol[:3] + '/' + symbol[3:]
    try:
        return await float(CON.get_candles(symbol, period='m1', number=1)['bidclose'])
    except:
        return 0


@app.get('/')
def read_root():
    return '/spread/?pairs=AUDUSD&pairs=CADCHF&betas=1&betas=-4.0686013955488303'


@app.get('/spread/')
async def calc_spread(pairs: Union[List[str], None] = Query(default=None),  
                      betas: Union[List[float], None] = Query(default=None)):
    
    response = {}

    prices = []
    for pair in pairs:
        price = await get_price(pair)
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


@app.get('/close/')
def close():
    CON.close()
    return {'Response': 'Connection closed'}


# uvicorn main:app --host 0.0.0.0 --port 10000
# uvicorn main:app --reload

# http://127.0.0.1:8000/spread/?pairs=AUDUSD&pairs=CADCHF&betas=1&betas=-4.0686013955488303

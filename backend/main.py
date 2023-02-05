from fastapi import FastAPI
import datetime
import fxcmpy
import time

app = FastAPI()

PRICES = {}
INTERVAL = 15 * 60 # 15 Mins

print('[.] Establishing connection')
TOKEN = 'ff6efd1deca512f4db9d4e0594040b083ddf3cda'
CON = fxcmpy.fxcmpy(access_token=TOKEN, log_level='error')
print('[+] Connected')

def epoch_to_timestamp(epoch):
    return datetime.datetime.fromtimestamp(epoch).strftime('%Y-%m-%d %H:%M:%S')


@app.get('/')
def read_root():
    return {}


@app.get('/symbols/{symbol}')
def get_price(symbol: str):
    time_now = int(time.time()) // INTERVAL
    symbol = symbol.upper()
    
    if '/' not in symbol:
        symbol = symbol[:3] + '/' + symbol[3:]

    if symbol in PRICES and PRICES[symbol][0] == time_now:
        return

    try:
        price = float(CON.get_candles(symbol, period='m1', number=1)['bidclose'])
        PRICES[symbol] = [time_now, price]

        return {'Symbol': symbol, 'Price': price, 'Datetime': epoch_to_timestamp(time_now * INTERVAL)}
    except:
        return {}


@app.get('/close/')
def close():
    CON.close()
    return {'Response': 'Connection closed'}


# uvicorn main:app --reload
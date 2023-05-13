from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())
from fastapi.middleware.cors import CORSMiddleware
from functions import log, epoch_to_datetime
from fx_api import fetch_prices, PAIRS
from database_handler import *
from fastapi import FastAPI
import asyncio
import uvicorn
import time


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)


PIPS = {pair:0.01 if pair[3:] == 'JPY' else 0.0001 for pair in PAIRS}
PREV_DB_UPDATE_TIME = 0
DB_UPDATE_INTERVAL = 60 * 60 # add new record to database every 1 hour
PREV_QUERY = 0
QUERY_INTERVAL = 15 * 60 # query for pice updates every 15 mins
LOOP_INTERVAL = 1 * 60 # Every 1 min, check if new query should be made
PREV_LOOP = 0

prices = {pair:0 for pair in PAIRS} # store current prices in memory
    
init_db()

last_db_record = find_last(f'prices_{num_collections()}')

if last_db_record:
    log('Last DB record found', 1)
    log(last_db_record, 3)

    PREV_DB_UPDATE_TIME = int(last_db_record['datetime'])

    del last_db_record['datetime']

    log('Convert last prices (points) to pips', 3)

    prices = last_db_record
    for pair in PAIRS:
        prices[pair] *= PIPS[pair]

print('+--------------------------+')
print('|      QUERY INTERVAL      |', QUERY_INTERVAL / 60, 'mins')
print('+--------------------------+')
print('| DATABASE UPDATE INTERVAL |', DB_UPDATE_INTERVAL / 60, 'mins')
print('+--------------------------+')
print('|   PREV DATABASE UPDATE   |', epoch_to_datetime(PREV_DB_UPDATE_TIME))
print('+--------------------------+')
print()

async def query_interval():
    '''
    Every QUERY_INTERVAL seconds, update prices of all symbols in PAIRS in server memory.
    If more than DB_UPDATE_INTERVAL seconds has passed since PREV_DB_UPDATE_TIME, insert new prices into database
    '''
    global PREV_DB_UPDATE_TIME, PREV_QUERY, PREV_LOOP, prices
    prices_copy = None

    while True:
        curr_time = int(time.time())
        log('New Loop', 3)

        PREV_LOOP = curr_time

        if curr_time // QUERY_INTERVAL > PREV_QUERY // QUERY_INTERVAL:
            log('Fetching prices ...', 3)
            prices = fetch_prices()
            PREV_QUERY = curr_time
        
            # more than DB_UPDATE_INTERVAL seconds has passed since PREV_DB_UPDATE_TIME
            if curr_time // DB_UPDATE_INTERVAL > PREV_DB_UPDATE_TIME // DB_UPDATE_INTERVAL:
                log('Pushing prices to database ...', 3)
                PREV_DB_UPDATE_TIME = int(time.time()) // DB_UPDATE_INTERVAL * DB_UPDATE_INTERVAL
                
                prices_copy = prices.copy()
                for pair in prices_copy:
                    prices_copy[pair] /= PIPS[pair]
                prices_copy['datetime'] = PREV_DB_UPDATE_TIME

                # insert new prices into database
                insert_doc(prices_copy)
                log('Inserted', 1)

        await asyncio.sleep(LOOP_INTERVAL)

# +---------------+
# | API Endpoints |
# +---------------+

@app.get('/')
def root():
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
async def get_price(symbol: str):
    '''
    Return price of symbol in M1 period

    :param str symbol: Symbol/ticker of instrument to query for
    :return: Price of symbol
    :rtype: float
    '''
    return prices[symbol]

@app.get('/prices/')
def get_prices():
    '''
    Return prices of all pairs in last period

    :return: Prices of all pairs in last period
    :rtype: dict
    '''
    return prices

@app.get('/historical/chain/')
def get_chain_historical_prices(n: int = 1):
    '''
    Return all historical prices in chunks of 10,000 (size of each collection)

    :param int n: Database collection ID
    :return: Historical prices in prices_{n} collection
    :rtype: dict
    '''
    return {'prices': find_all(f'prices_{n}'), 'next': n+1 if n<num_collections() else 0}

@app.get('/historical/last/')
def get_last_historical_prices(n: int = 1000):
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

@app.get('/last-update/')
async def get_last_update():
    '''
    Show datetimes of last update attempts for price, database and FXCM connection

    :return: Object showing datetime of last price update, last database update and last FXCM connection attempt
    :rtype: dict
    '''
    return {
        'Last loop': epoch_to_datetime(PREV_LOOP),
        'Last query': epoch_to_datetime(PREV_QUERY),
        'Last database update': epoch_to_datetime(PREV_DB_UPDATE_TIME)
    }

@app.on_event('startup')
async def schedule_interval():
    '''
    On app startup, schedule async background loop that continually queries for new prices every QUERY_INTERVAL seconds.
    Insert new price data to database every DB_UPDATE_INTERVAL seconds
    '''
    log('Starting background loop', 3)
    loop = asyncio.get_event_loop()
    loop.create_task(query_interval())

if __name__ == '__main__':
    uvicorn.run('main:app', host='0.0.0.0', port=10000, reload=True)
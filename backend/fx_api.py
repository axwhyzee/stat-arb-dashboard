from dotenv import load_dotenv, find_dotenv
import requests
import os

load_dotenv(find_dotenv())

URL = "https://api.currencybeacon.com/v1/latest"

PAIRS = ['AUDCAD', 'AUDCHF', 'AUDJPY', 'AUDNZD', 'AUDUSD', 'CADCHF', 'CADJPY', 'CHFJPY', 'EURAUD', 'EURCAD', 'EURCHF', 'EURGBP', 'EURJPY', 'EURNZD', 'EURUSD', 'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPJPY', 'GBPNZD', 'GBPUSD', 'NZDCAD', 'NZDCHF', 'NZDJPY', 'NZDUSD', 'USDCAD', 'USDCHF', 'USDJPY']

PARAMS = {
    "base": "USD",
    "api_key": os.environ.get('API_KEY')
}

def fetch_prices():
    '''
    Fetch current FX prices from API

    :return: JSON of prices
    :rtype: dict
    '''
    response = requests.get(URL, params=PARAMS)
    rates = response.json()['response']['rates']
    prices = {}

    for pair in PAIRS:
        base, quote = pair[:3], pair[3:]
        prices[pair] = rates[quote] / rates[base]
    
    return prices

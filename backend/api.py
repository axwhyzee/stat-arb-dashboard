import requests
import os


PRICING_COMPONENT_MAP = {
    'A': 'ask',
    'B': 'bid',
    'M': 'mid'
}
GRANULARITY = 'M1'
PRICING_COMPONENT = 'A'
PRICING_COMPONENT_FULL = PRICING_COMPONENT_MAP[PRICING_COMPONENT]
PAIRS = ['AUDCAD', 'AUDCHF', 'AUDJPY', 'AUDNZD', 'AUDUSD', 'CADCHF', 'CADJPY', 'CHFJPY', 'EURAUD', 'EURCAD', 'EURCHF', 'EURGBP', 'EURJPY', 'EURNZD', 'EURUSD', 'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPJPY', 'GBPNZD', 'GBPUSD', 'NZDCAD', 'NZDCHF', 'NZDJPY', 'NZDUSD', 'USDCAD', 'USDCHF', 'USDJPY']
URL = os.environ.get('OANDA_API_URL')
HEADERS = {
    'Authorization': os.environ.get('OANDA_API_KEY')
}
PARAMS = {
    'candleSpecifications': ','.join([f'{pair[:3]}_{pair[3:]}:{GRANULARITY}:{PRICING_COMPONENT}' for pair in PAIRS])                          
}


def fetch_prices():
    '''
    Fetch current FX prices from API

    :return: JSON of prices
    :rtype: dict
    '''
    response = requests.get(URL, params=PARAMS, headers=HEADERS)
    data = response.json()

    prices = {}
    for pair_info in data['latestCandles']:
        pair = pair_info['instrument'].replace('_', '')
        prices[pair] = float(pair_info['candles'][-1][PRICING_COMPONENT_FULL]['o'])

    return prices
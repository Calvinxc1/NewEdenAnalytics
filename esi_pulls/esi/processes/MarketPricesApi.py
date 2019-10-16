from . import Api

RENAMES = {'timestamp': 'record_time'}
TABLE = 'MarketPrices'
URL = {'main': 'markets/prices'}

class MarketPricesApi(Api):
    def __init__(self, verbose=False):
        super().__init__(renames=RENAMES, table=TABLE, url=URL, verbose=verbose)
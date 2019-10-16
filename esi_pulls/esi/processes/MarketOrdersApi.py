import pandas as pd
from datetime import datetime as dt

from . import Api

PURGE = True
RENAMES = {'timestamp': 'record_time', 'range': 'order_range'}
REGION_IDS = [10000002, 10000043, 10000052]
TABLE = 'MarketOrders'
URL = {'main': 'markets/{region_id}/orders'}

class MarketOrdersApi(Api):
    def __init__(self, verbose=False):
        super().__init__(purge=PURGE, renames=RENAMES, table=TABLE, url=URL, verbose=verbose)
        self.region_ids = REGION_IDS
        
    def _get_raw_data(self) -> list:
        self._msg('Getting raw data...')
        raw_data = []
        for region_id in self.region_ids:
            url = self._build_url('main').format(region_id=region_id)
            raw_data_items = self._esi_pull(url)
            raw_data.extend(raw_data_items)
        return raw_data
    
    def _clean_data(self, parsed_data:pd.DataFrame) -> pd.DataFrame:
        parsed_data['issued'] = parsed_data['issued'].apply(lambda x: dt.strptime(x, '%Y-%m-%dT%H:%M:%SZ'))
        return parsed_data
import pandas as pd
from datetime import datetime as dt

from esi.processes.Api import Api

RENAMES = {
    'timestamp': 'record_time',
    'state': 'order_state',
    'is_buy_order': 'is_buy',
    'issued': 'issued_time',
    'issued_by': 'issued_by_char',
    'range': 'order_range',
}
TABLE = 'Corp_MarketOrders'
URL = {
    'main': 'corporations/{corp_id}/orders',
    'history': 'corporations/{corp_id}/orders/history'
}
AUTH = True
PARAMS = {}

class CorpMarketOrdersApi(Api):
    def __init__(self, verbose=False):
        super().__init__(auth=AUTH, renames=RENAMES, table=TABLE, url=URL, verbose=verbose, params=PARAMS)
        
    def _get_raw_data(self):
        self._msg('Getting raw data...')
        headers = {'Authorization': self.auth_data['Authorization']} if self.auth else {}
        raw_data_items = []
        for url_key in self.url.keys():
            if url_key == 'root': continue
            url = self._build_url(url_key)
            raw_data_items.extend(self._esi_pull(url, headers=headers))
        return raw_data_items
        
    def _build_url(self, url_name:str):
        url = '{root}/{path}'.format(root=self.url['root'], path=self.url[url_name]).format(corp_id=self.auth_data['corp_id'])
        return url
    
    def _clean_data(self, parsed_data:pd.DataFrame):
        parsed_data['order_state'] = parsed_data['order_state'].fillna('active')
        parsed_data['is_buy'] = parsed_data['is_buy'].fillna(False)
        parsed_data['issued_time'] = parsed_data['issued_time'].apply(lambda x: dt.strptime(x, '%Y-%m-%dT%H:%M:%SZ'))
        parsed_data['corporation_id'] = self.auth_data['corp_id']
        return parsed_data
    
    def _load_etags(self, esi_record:list):
        self.esi_record = pd.DataFrame(self.esi_record).drop_duplicates().reset_index(drop=True)
        self._insert_data(self.esi_record, self.etag_table, upsert=True)
        expires = self.esi_record['expires'].min().to_pydatetime()
        return expires
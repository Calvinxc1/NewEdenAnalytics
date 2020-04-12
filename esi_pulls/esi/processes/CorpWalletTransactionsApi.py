import pandas as pd
from datetime import datetime as dt

from esi.processes.Api import Api

RENAMES = {
    'timestamp': 'record_time',
    'date': 'transaction_date',
}
TABLE = 'Corp_WalletTransactions'
URL = {'main': 'corporations/{corp_id}/wallets/{division}/transactions'}
AUTH = True
PARAMS = {}

class CorpWalletTransactionsApi(Api):
    def __init__(self, verbose=False):
        super().__init__(auth=AUTH, renames=RENAMES, table=TABLE, url=URL, verbose=verbose, params=PARAMS)
        
    def _get_raw_data(self):
        self._msg('Getting raw data...')
        raw_data_items = []
        headers = {'Authorization': self.auth_data['Authorization']} if self.auth else {}
        for division in range(1, 8):
            url = self._build_url('main').format(corp_id=self.auth_data['corp_id'], division=division)
            data_units = self._esi_pull(url, headers=headers)
            for data_unit in data_units:
                for record in data_unit.data:
                    record.update({'division': division})
            raw_data_items.extend(data_units)
        return raw_data_items
    
    def _clean_data(self, parsed_data:pd.DataFrame):
        parsed_data['transaction_date'] = parsed_data['transaction_date'].apply(lambda x: dt.strptime(x, '%Y-%m-%dT%H:%M:%SZ'))
        parsed_data['corporation_id'] = self.auth_data['corp_id']
        return parsed_data
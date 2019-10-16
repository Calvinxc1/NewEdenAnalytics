import pandas as pd
from datetime import datetime as dt

from . import Api

RENAMES = {
    'timestamp': 'record_time',
    'blueprint_id': 'blueprint_item_id',
    'installer_id': 'installer_character_id',
}
TABLE = 'Corp_IndustryJobs'
URL = {'main': 'corporations/{corp_id}/industry/jobs'}
AUTH = True
PARAMS = {'include_completed': True}

class CorpIndustryJobsApi(Api):
    def __init__(self, verbose=False):
        super().__init__(auth=AUTH, renames=RENAMES, table=TABLE, url=URL, verbose=verbose, params=PARAMS)
        
    def _build_url(self, url_name:str):
        url = '{root}/{path}'.format(root=self.url['root'], path=self.url[url_name]).format(corp_id=self.auth_data['corp_id'])
        return url
    
    def _clean_data(self, parsed_data:pd.DataFrame):
        for col in ('start_date', 'pause_date', 'end_date', 'completed_date'):
            if col in parsed_data.columns:
                parsed_data[col] = parsed_data[col].apply(
                    lambda x: dt.strptime(x, '%Y-%m-%dT%H:%M:%SZ') if pd.notnull(x) else None
                )
            
        parsed_data['corporation_id'] = self.auth_data['corp_id']
        return parsed_data
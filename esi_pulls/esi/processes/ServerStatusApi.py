import pandas as pd
from datetime import datetime as dt

from .import Api
from ..utils import Container

RENAMES = {'timestamp': 'record_time'}
TABLE = 'ServerStatus'
URL = {'main': 'status'}

class ServerStatusApi(Api):
    def __init__(self, verbose=False):
        super().__init__(renames=RENAMES, table=TABLE, url=URL, verbose=verbose)
    
    def _parse_data_item(self, data_item:Container, renames:dict, **kwargs):
        try:
            data_frame = pd.DataFrame([data_item.data])
        except Exception as e:
            self._email('fail', data_item.data)
            raise
        for key in data_item:
            if key == 'data': continue
            data_frame[key] = data_item[key]

        for key, val in kwargs.items():
            data_frame[key] = val

        data_frame.rename(columns=renames, inplace=True)
        return data_frame
    
    def _clean_data(self, parsed_data:pd.DataFrame):
        parsed_data['start_time'] = parsed_data['start_time'].apply(lambda x: dt.strptime(x, '%Y-%m-%dT%H:%M:%SZ'))
        return parsed_data
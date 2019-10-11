import pandas as pd
from datetime import datetime as dt

from Api import Api
import _CONST as CONST
from utils.Container import Container

CONST.RENAMES = {'timestamp': 'record_time'}
CONST.TABLE = 'ServerStatus'
CONST.URL.main = 'status'
CONST.USE_TIMESTAMP = True

class ServerStatusApi(Api):
    def _parse_data_item(self, data_item:Container, renames:dict, **kwargs):
        data_frame = pd.DataFrame([data_item.data])
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
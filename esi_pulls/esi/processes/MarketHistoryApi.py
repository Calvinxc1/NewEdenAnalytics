import pandas as pd
from datetime import datetime as dt, timedelta as td
import mysql.connector as mdb
import ujson as js

from .import Api
from ..utils import Container

RENAMES = {
    'date': 'record_date',
    'order_count': 'orders',
    'highest': 'high_price',
    'average': 'avg_price',
    'lowest': 'low_price',
}
SQL = {'region_ids': 'SELECT region_id FROM MapRegions;'}
TABLE = 'MarketHistory'
URL = {
    'types': 'markets/{region_id}/types',
    'history': 'markets/{region_id}/history',
}
USE_TIMESTAMP = False

class MarketHistoryApi(Api):
    def __init__(self, lookback_days=7, verbose=False):
        super().__init__(renames=RENAMES, sql=SQL, table=TABLE, url=URL, use_timestamp=USE_TIMESTAMP, verbose=verbose)
        self.lookback = (dt.now().date() - td(days=lookback_days)).isoformat()
    
    def run_process(self):
        self._msg('Running Process...')
        self.init_items()
        self._connect_maria(self.maria_login_path)
        self.data_buffer = self._get_region_ids()
        self.data_buffer = self._get_region_types(self.data_buffer)
        self.data_buffer = self._get_region_data(self.data_buffer)
        if self.data_buffer is not None: self._insert_data(self.data_buffer, self.table)
        expires = self._load_etags(self.esi_record)
        self.conn.maria.close()
        self._msg('Process complete.')
        return expires
            
    def _get_region_ids(self):
        self._msg('Selecting Region IDs from MariaDB...')
        region_ids = pd.read_sql(
            self.sql['region_ids'],
            self.conn.maria
        )['region_id'].values.tolist()
        return region_ids
    
    def _get_region_types(self, region_ids:list):
        self._msg('Retrieving Region Types from ESI...')
        region_types = {
            region_id: self.pool.apply(
                self._parse_region_types,
                args=(region_id,)
            ).iloc[:, 0].values.tolist()
            for region_id in self._tqdm(region_ids)
        }
        return region_types
    
    def _parse_region_types(self, region_id:int):
        url = self._build_url('types').format(region_id=region_id)
        data_items = self._esi_pull(url)
        parsed_data = self._parse_data(data_items, {})
        return parsed_data
    
    def _get_region_data(self, region_types:dict):
        self._msg('Retrieving Region Market History from ESI...')
        region_items = [
            (region_id, type_id)
            for region_id, type_ids in region_types.items()
            for type_id in type_ids if type_ids is not None
        ]
        parsed_data = list(self._tqdm(self.pool.imap_unordered(
            self._parse_region_data,
            region_items
        ), total=len(region_items)))
        parsed_data = [data for data in parsed_data if data is not None]
        if len(parsed_data) > 0:
            parsed_data = pd.concat(parsed_data, ignore_index=True, sort=False)
            return parsed_data
        else:
            return None
        
    def _parse_region_data(self, region_item:tuple):
        region_id, type_id = region_item
        url = self._build_url('history').format(region_id=region_id)
        data_items = self._esi_pull(url, params={'type_id': type_id})
        if isinstance(data_items, Container): return None
        parsed_data = self._parse_data(data_items, self.renames, region_id=region_id, type_id=type_id)
        parsed_data = self._filter_region_data(parsed_data)
        return parsed_data
        
    def _filter_region_data(self, parsed_data:pd.DataFrame):
        if 'record_date' not in parsed_data.columns: return None
        
        parsed_data = parsed_data.loc[parsed_data['record_date'] >= self.lookback]
        
        if len(parsed_data) == 0: return None
        else: return parsed_data
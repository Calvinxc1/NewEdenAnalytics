import pandas as pd
from multiprocessing.dummy import Pool
import mysql.connector as mdb
import ujson as js
from datetime import datetime as dt, timedelta as td
from tqdm import tqdm_notebook as tqdm
import requests as rq
import gc
import pymongo as pm

from ..utils import Container, send_email
from .._constants import constants as CONST

class Api:
    def __init__(self, renames:dict, table:str, page_max_pool=4, auth=False,
                 purge=False, sql={}, upsert=True, use_timestamp=True,
                 url={}, verbose=False, params={}, headers={}):
        self.auth = auth
        self.commit_rows = CONST.COMMIT_ROWS
        self.email_login_path = CONST.EMAIL_LOGIN_PATH
        self.esi_retrys = CONST.ESI_RETRYS
        self.etag_table = CONST.ETAG_TABLE
        self.headers = {**CONST.HEADERS, **headers}
        self.mongo_login_path = CONST.MONGO_LOGIN_PATH
        self.mongo_db = CONST.MONGO_DB
        self.maria_login_path = CONST.MARIA_LOGIN_PATH
        self.params = {**CONST.PARAMS, **params}
        self.pool = Pool(page_max_pool)
        self.purge = purge
        self.renames = renames
        self.sql = {**CONST.SQL, **sql}
        self.table = table
        self.upsert = upsert
        self.use_timestamp = use_timestamp
        self.url = {**CONST.URL, **url}
        self.verbose = verbose
        
    def _msg(self, message:str):
        """ Custom verbose print method
        
        Custom print method for console logging, if verbose
        class parameter is True.
        
        Parameters
        ----------
        message: str
            Message to be printed to the console
        """
        
        if self.verbose:
            print('{time}:{process} - {message}'.format(
                time=dt.now().strftime('%Y-%m-%d %H:%M:%S.%f'),
                process=self.__class__.__name__,
                message=message
            ))
            
    def _email(self, error_type, error_body):
        send_email(error_type, {
            'process': self.__class__.__name__,
            'time': dt.now().isoformat(' '),
            'note': error_body
        }, self.email_login_path)
        
    def _tqdm(self, iterator, leave=False, total=None):
        """ Custom iterator wrapper
        
        Custom iterator wrapper, supporting TQDM output if
        the verbose class parameter is True.
        
        Parameters
        ----------
        iterator: iterator
            Iterator to wrap
        leave: bool, optional (default False)
            Controls if the TQDM bar stays after completing
        total: int, optional (default None, which tracks however long the iterator is)
            Controls how many iterations the TQDM bar will track
        """
        
        if total is None: total = len(iterator)
        return tqdm(iterator, leave=leave, total=total) if self.verbose else iterator
    
    def run_process(self):
        self._msg('Running Process...')
        self.init_items()
        self.data_buffer = self._get_raw_data()
        self.data_buffer = self._parse_data(self.data_buffer, self.renames)
        self._connect_maria(self.maria_login_path)
        self._insert_data(self.data_buffer, self.table, purge=self.purge)
        expires = self._load_etags(self.esi_record)
        self.conn.maria.close()
        self._msg('Process complete.')
        return expires
    
    def init_items(self):
        self.conn = Container()
        self.data_buffer = None
        self.esi_record = []
        gc.collect()
        if self.auth: self.load_auth_token()
        
    def load_auth_token(self):
        self.connect_mongo()
        auth_char_id = self.conn['mongo'][self.mongo_db]['app_settings'].find_one({'_id': 'corp_char'})['char_id']
        auth_char = self.conn['mongo'][self.mongo_db]['eve_characters'].find_one({'_id': auth_char_id})
        self.auth_data = {
            'char_id': auth_char['_id'],
            'corp_id': auth_char['corp_id'],
            'Authorization': 'Bearer {token}'.format(token=auth_char['tokens']['access_token']),
        }
        self.conn['mongo'].close()
    
    def connect_mongo(self):
        with open(self.mongo_login_path) as file:
            mongo_settings = js.load(file)
            self.conn['mongo'] = pm.MongoClient(**mongo_settings)
    
    def _get_raw_data(self):
        self._msg('Getting raw data...')
        url = self._build_url('main')
        headers = {'Authorization': self.auth_data['Authorization']} if self.auth else {}
        raw_data_items = self._esi_pull(url, headers=headers)
        return raw_data_items
    
    def _build_url(self, url_name:str):
        url = '{root}/{path}'.format(root=self.url['root'], path=self.url[url_name])
        return url
            
    def _esi_pull(self, url:str, method='get', params={}, headers={}):
        params={**self.params, **params}
        headers={**self.headers, **headers}
        data_item, pages = self._call_api(
            method,
            url,
            params=params,
            headers=headers
        )
        
        if pages == 0: data_items = data_item
        else: data_items = [data_item]
        
        if pages > 1:
            data_items.extend([
                self.pool.apply(
                    self._call_api,
                    args=(method, url),
                    kwds={
                        'params': {**params, 'page': page},
                        'headers': headers
                    }
                )[0]
                for page in range(2, pages+1)
            ])
        
        return data_items
    
    def _call_api(self, *args, **kwargs):
        for i in range(self.esi_retrys):
            session = rq.request(*args, **kwargs)
            if session.status_code == 200: break
                
        if session.status_code == 200:
            data_item = self._parse_esi(session)
            pages = int(session.headers.get('X-Pages', 1))
            self._record_esi(session)
        else:
            data_item = Container(
                code=session.status_code,
                url=session.url,
                body=session.content
            )
            pages = 0

        return (data_item, pages)
    
    def _parse_esi(self, session):
        data_item = Container(
            data=session.json(),
            etag=session.headers['ETag'].replace('W/', '').replace('"', '')
        )
        if self.use_timestamp: data_item.timestamp = dt.strptime(session.headers['Last-Modified'], '%a, %d %b %Y %H:%M:%S %Z')
        return data_item
    
    def _record_esi(self, session):
        self.esi_record.append({
            'url': session.url.split('?')[0],
            'timestamp': dt.strptime(session.headers['Last-Modified'], '%a, %d %b %Y %H:%M:%S %Z'),
            'expires': dt.strptime(session.headers['Expires'], '%a, %d %b %Y %H:%M:%S %Z'),
            'etag': session.headers['ETag'].replace('W/', '').replace('"', '')
        })
    
    def _parse_data(self, data_items:list, renames:dict, **kwargs):
        self._msg('Parsing raw data...')
        parsed_data = pd.concat([
            self._parse_data_item(data_item, renames, **kwargs)
            for data_item in data_items
        ], axis=0, ignore_index=True, sort=False)
        parsed_data = self._clean_data(parsed_data)
        return parsed_data
    
    def _parse_data_item(self, data_item:Container, renames:dict, **kwargs):
        data_frame = pd.DataFrame(data_item.data)
        for key in data_item:
            if key == 'data': continue
            data_frame[key] = data_item[key]

        for key, val in kwargs.items():
            data_frame[key] = val

        data_frame.rename(columns=renames, inplace=True)
        return data_frame
    
    def _clean_data(self, parsed_data:pd.DataFrame):
        """Define in child class"""
        return parsed_data
        
    def _connect_maria(self, maria_login_path:str):
        with open(maria_login_path) as file:
            self.conn.maria = mdb.connect(**js.load(file))
        
    def _insert_data(self, data_frame:pd.DataFrame, data_table:str, upsert=None, purge=False):
        """ Inserts data to specified table
        
        Inserts data from a DataFrame into the specified MariaDB
        table. Also controls upsert behavior if the upsert class
        parameter is True
        
        Parameters
        ----------
        data_frame: DataFrame
            Pandas DataFrame for inserting into MariaDB table
        data_table: str
            Table in MariaDB to insert data to
        tqdm_leave: bool, optional
            Controls wether or not the TQDM iterator stays
            after completing (default False)
        """
        
        self._msg('Inserting data...')
        
        if purge: self._purge_data(data_table)
        
        if upsert is None: upsert = self.upsert
        
        upsert_str = ' ON DUPLICATE KEY UPDATE {upsert}'.format(
                upsert=','.join([
                '{col}=VALUES({col})'.format(col=col)
                for col in data_frame.columns
            ])
        ) if upsert else ''
        
        insert_script = self.sql['insert'].format(
            table=data_table,
            cols=','.join(data_frame.columns),
            vals=','.join(['%s'] * data_frame.columns.size),
            upsert=upsert_str
        )
        
        data_list = data_frame.where(pd.notnull(data_frame), None).values.tolist()
        data_list = [
            data_list[i:i + self.commit_rows]
            for i in range(0, len(data_list), self.commit_rows)
        ]
        
        cur = self.conn['maria'].cursor()
        for insert_rows in self._tqdm(data_list):
            cur.executemany(insert_script, insert_rows)
            self.conn['maria'].commit()
        cur.close()
        
    def _purge_data(self, data_table:str):
        purge_script = self.sql['purge'].format(table=data_table)
        
        cur = self.conn['maria'].cursor()
        cur.execute(purge_script)
        self.conn['maria'].commit()
        cur.close()
        
    def _load_etags(self, esi_record:list):
        self.esi_record = pd.DataFrame(self.esi_record).drop_duplicates().reset_index(drop=True)
        self._insert_data(self.esi_record, self.etag_table, upsert=True)
        expires = self.esi_record['expires'].max().to_pydatetime()
        return expires
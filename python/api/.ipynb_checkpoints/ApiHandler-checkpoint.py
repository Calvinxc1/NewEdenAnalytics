import pandas as pd
import requests as rq
from datetime import datetime as dt
import mysql.connector as mysql
import pymongo as pm
import ujson as js
from time import sleep

from utils.email import send_email

class ApiHandler:
    settings = {
        'maria_login_path': '../settings/maria_login.json',
        'mongo_login_path': '../settings/mongo_login.json'
    }
    url = {
        'data': None ## Define in child class(es)
    }
    url_params = {}
    sql = {
        'insert': 'INSERT INTO {table} ({cols}) VALUES ({vals}) ON DUPLICATE KEY UPDATE {upsert};',
        'delete': "DELETE FROM {table} WHERE record_time != '{time}';"
    }
    script_vals = {
        'table': None
    }
    conn = {}
    headers = {'accept': 'application/json'}
    params = {'datasource': 'tranquility'}
    name = 'Root Handler'
    auth = False
    delete = False
    
    @property
    def auth_token(self):
        self.connect_mongo()
        auth_char_id = self.conn['mongo'][self.mongo['database']]['app_settings'].find_one({'_id':'corp_char'})['char_id']
        auth_char = self.conn['mongo'][self.mongo['database']]['eve_characters'].find_one({'_id':auth_char_id})
        self.url_params = {
            **self.url_params,
            'char_id': auth_char['_id'],
            'corp_id': auth_char['corp_id']
        }
        auth_token = auth_char['tokens']['access_token']
        self.conn['mongo'].close()
        return auth_token
    
    def __init__(self, verbose = False):
        self.verbose = verbose
        
    def _verbose(self, func, msg):
        message = '{func} - {time}: {msg}'
        print(message.format(**{'func':func,'time':datetime.now().isoformat(' '),'msg':msg}))
    
    def _email(self, error_type, error_body):
        send_email(error_type, {
            'process': self.name,
            'time': dt.now().isoformat(' '),
            'note': error_body
        })
        
    def connect_maria(self):
        if self.verbose: self._verbose('connect_maria', 'Establishing connection to Maria database...')
        with open(self.settings['maria_login_path']) as file:
            self.conn['maria'] = mysql.connect(**js.load(file))
        if self.verbose: self._verbose('connect_maria', 'Maria database connection established.')
            
    def connect_mongo(self):
        if self.verbose: self._verbose('connect_mongo', 'Establishing connection to Mongo database...')
        with open(self.settings['mongo_login_path']) as file:
            mongo_settings = js.load(file)
            self.mongo = {'database': mongo_settings['authSource']}
            self.conn['mongo'] = pm.MongoClient(**mongo_settings)
        if self.verbose: self._verbose('connect_mongo', 'Mongo database connection established.')
    
    def run_process(self):
        try:
            raw_data = self.get_raw_data()
            data_frame = self.build_data(raw_data)
            self.insert_data(data_frame)
        except Exception as e:
            send_email('fail', {
                'process': self.name,
                'time': dt.now().isoformat(' '),
                'note': e
            })
            
    def get_raw_data(self):
        if self.verbose: self._verbose('get_raw_data', 'Getting raw data...')
        
        if self.auth:
            self.headers['Authorization'] = 'Bearer {token}'.format(**{
                'token': self.auth_token
            })
            
        data_conn = self.url_get(
            self.url['data'].format(**self.url_params),
            self.headers,
            self.params
        )
        
        self.timestamp = dt.strptime(
            data_conn.headers['Last-Modified'],
            '%a, %d %b %Y %H:%M:%S %Z'
        ).strftime('%Y-%m-%d %H:%M:%S')
        
        page_count = int(data_conn.headers.get('X-Pages', '1'))
        if page_count != 1:
            if self.verbose: self._verbose('get_raw_data', 'Multi-page raw data...')
            data_conn = [data_conn.content]
            for page in range(2, page_count+1):
                data_conn.append(self.url_get(
                    self.url['data'].format(**self.url_params),
                    self.headers,
                    {**self.params, 'page': page}
                ).content)
        else:
            data_conn = data_conn.content

        if self.verbose: self._verbose('get_raw_data', 'Raw data acquired.')
        
        return data_conn
    
    def url_get(self, url, headers, params, max_retries=10):
        retrieve = True
        retries = 0
        while retrieve:
            data_conn = rq.get(
                url,
                headers = headers,
                params = params
            )
            
            if retries > max_retries:
                raise Exception("""\
                    Connection returned a {status} code on pull. Exceeded max retries of {max_retries}
                    Message body:
                    {body}\
                """.format(
                    status=data_conn.status_code,
                    max_retries=max_retries,
                    body=data_conn.content.decode('utf-8')
                ))
            elif data_conn.status_code in (502,):
                retries += 1
                sleep(1)
                continue
            elif data_conn.status_code == 200:
                retrieve = False
            else:
                raise Exception("""\
                    Connection returned a {status} code on pull.
                    Message body:
                    {body}\
                """.format(**{
                    'status': data_conn.status_code,
                    'body': data_conn.content.decode('utf-8')
                }))
            
        return data_conn
            
    def build_data(self, raw_data):
        ## Defined in child class(es)
        pass
    
    def insert_data(self, data_frame):
        self.connect_maria()
        self.data_inserter(data_frame)
        self.conn['maria'].close()
        
    def data_inserter(self, data_frame):
        if self.verbose: self._verbose('insert_data', 'Inserting records...')
        
        insert_script = self.sql['insert'].format(**{
            'table': self.script_vals['table'],
            'cols': ','.join(data_frame.columns),
            'vals': ','.join(['%s']*data_frame.columns.size),
            'upsert': ','.join(['{col}=VALUES({col})'.format(col=col) for col in data_frame.columns])
        })
        
        cur = self.conn['maria'].cursor()
        
        for row in data_frame.itertuples():
            cur.execute(
                insert_script,
                [val if pd.notnull(val) else None for val in row[1:]]
            )
        self.conn['maria'].commit()
        
        if self.delete: self.data_deleter(cur)
            
        cur.close()
        
        if self.verbose: self._verbose('insert_data', 'Records inserted.')
            
    def data_deleter(self, cur):
        if self.verbose: self._verbose('data_deleter', 'Deleting old records...')
        delete_script = self.sql['delete'].format(**{
            'table': self.script_vals['table'],
            'time': dt.strptime(self.timestamp, '%Y-%m-%d %H:%M:%S')
        })
        cur.execute(delete_script)
        self.conn['maria'].commit()
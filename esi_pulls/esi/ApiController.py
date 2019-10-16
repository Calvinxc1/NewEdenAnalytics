from threading import Thread
from time import sleep
from datetime import datetime as dt
import pymongo as pm
import ujson as js

from .processes import MarketHistoryApi, ServerStatusApi, SystemJumpsApi, SystemKillsApi, MarketOrdersApi, MarketPricesApi, CorpIndustryJobsApi
from .utils import Container, send_email
from ._constants import constants as CONST

class ApiController:
    def __init__(self, processes, verbose=False):
        self._threads = None
        self.email_login_path = CONST.EMAIL_LOGIN_PATH
        self.mongo_db = CONST.MONGO_DB
        self.mongo_expire_coll = CONST.MONGO_EXPIRE_COLL
        self.mongo_login_path = CONST.MONGO_LOGIN_PATH
        
        self.processes = processes
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
            
    def _email(self, error_type:str, error_body:str):
        send_email(error_type, dict(
            process=self.__class__.__name__,
            time=dt.now().isoformat(' '),
            note=error_body
        ), self.email_login_path)
        
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
    
    def connect_mongo(self, mongo_login_path):
        with open(mongo_login_path) as file:
            mongo = pm.MongoClient(**js.load(file))
        return mongo
        
    def launch_threads(self, processes):
        self._msg('Loading {proc_count} processes...'.format(proc_count=len(processes)))
        self._threads = [
            Thread(target=self._process_thread, args=(process, self.verbose))
            for process in processes
        ]
        [thread.start() for thread in self._threads]
        self._msg('Processes loaded.')
        
    def _process_thread(self, process, verbose):
        api = process.api(verbose=verbose)
        mongo = self.connect_mongo(self.mongo_login_path)
        expire = mongo[self.mongo_db][self.mongo_expire_coll].find_one({'_id': api.__class__.__name__})
        expire = dt.now() if expire is None else expire['expire']
        sleep_sec = (expire - dt.now()).total_seconds() + process.expire_delay
        while True:
            try:
                self._msg('Process {process} endpoint expires at {expire}. Sleeping thread for {sleep} seconds.'.format(
                    process=api.__class__.__name__,
                    expire=expire.isoformat(' '),
                    sleep=sleep_sec
                ))
                if sleep_sec > 0: sleep(sleep_sec)
                expire = api.run_process()
                mongo[self.mongo_db][self.mongo_expire_coll].update_one(
                    {'_id': api.__class__.__name__},
                    {'$set': {'expire': expire}},
                    upsert=True
                )
                sleep_sec = (expire - dt.now()).total_seconds() + process.expire_delay
            except Exception as e:
                trace = traceback.format_exc()
                self._email('fail', '{name} error: {error}\nTraceback: {trace}'.format(name=api.__class__.__name__, error=e, trace=trace))
                raise
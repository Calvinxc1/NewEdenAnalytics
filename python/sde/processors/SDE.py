import pandas as pd
from datetime import datetime as dt
import yaml
from tqdm import tqdm_notebook as tqdm, tnrange as trange
import ujson as js
import mysql.connector as mdb

class SdeProcessor:
    """ Root Processor class for EVE SDE
    
    This is the root parent class for the EVE Online SDE parser. Serves as a
    basis for all SDE parser classes.
    
    Parameters
    ----------
    sde_path : str
        Directory path containing the EVE SDE
    sde_version: str
        SDE version
    verbose: bool, optional
        Enables verbose logging, incl. TQDM for some iterators (default False)
        
    Attributes
    ----------
    commit_rows: int
        Controls how many records are inserted in one operation
    data_table: str
        Contains which table that insert operations will be performed on
    file_path: str
        Path to the file being processed (defined in child class)
    load_path: str
        A template string used for loading SDE files
    maria_login_path: str
        The path to the MariaDB login settings file
    renames: dict
        Dict containing old_name:new_name pairs for renaiming raw data fields
        to SQL fields
    sql: dict
        Contains SQL scripts used for various MariaDB operations
    upsert: bool
        Controls upserting behavior on MariaDB inserts
        
    Version History:
        0.1 (2019-09-29) - First working iteration
    """
    
    commit_rows = 10000
    load_path = './{sde_path}/{file_path}'
    maria_login_path = './../settings/maria_login.json'
    sql = {
        'insert': 'INSERT INTO {table} ({cols}) VALUES ({vals}){upsert};',
        'delete': 'DELETE FROM {table};'
    }
    upsert = False
    
    def __init__(self, sde_path:str, sde_version:str, verbose=False):
        self.verbose = verbose
        self.sde_path = sde_path
        self.sde_version = sde_version
        self.conn = {}
        self.data_buffer = None
        
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
            print('{time} - {message}'.format(
                time=dt.now().strftime('%Y-%m-%d %H:%M:%S.%f'),
                message=message
            ))
        
    def _tqdm(self, iterator, leave=False, total=None):
        """ Custom iterator wrapper
        
        Custom iterator wrapper, supporting TQDM output if
        the verbose class parameter is True.
        
        Parameters
        ----------
        iterator: iterator
            Iterator to wrap
        leave: bool, optional
            Controls if the TQDM bar stays after completing
            (default False)
        total: int, optional
            Controls how many iterations the TQDM bar will track
            (default None, which tracks however long the iterator is)
        """
        
        if total is None: total = len(iterator)
        return tqdm(iterator, leave=leave, total=total) if self.verbose else iterator
    
    def _range(self, i:int, leave=False):
        """ Custom range wrapper
        
        Custom range function wrapper, supporting TQDM
        output if the verbose class parameter is True.
        
        Parameters
        ----------
        i: int
            Number of iterations to cycle over
        leave: bool, optional
            Controls if the TQDM bar stays after completing
            (default False)
        """
        
        return trange(i, leave=leave) if self.verbose else range(i)
    
    def parse_schema(self, flat_data:list) -> dict:
        """ Parses a flat dictionary's schema
        
        Utility/debugging method for parsing a flat dictionary's
        general layout by iterating over several dictionaries and
        aggregating the results in an easy-to-understand way.
        
        Parameters
        ----------
        flat_data: list
            List of flat dictionaries to build the schema from
            
        Returns
        -------
        dict
            Schema inferred from flat_data
        """
        
        schema = {}
        for flat_item in self._tqdm(flat_data):
            for key, val in flat_item.items():
                val_type = type(val).__name__
                schema[key] = schema.get(key, {})
                schema[key][val_type] = schema[key].get(val_type, 0)
                schema[key][val_type] += 1

        return schema
        
    def run_process(self):
        """ Runs the processor's main process
        
        This is the primary method that will run through the
        processor's main methods to read, transform, and insert
        the EVE SDE data
        """
        
        self._msg('Beginning {proc_name}...'.format(proc_name=self.__class__.__name__))
        
        self.data_buffer = self.load_file(self.file_path)
        self.data_buffer = self.flatten_data(self.data_buffer)
        self.data_buffer = self.frame_construct(self.data_buffer, self.renames)
        self.upload_data(self.data_buffer, self.data_table)
        
        self._msg('{proc_name} complete.'.format(proc_name=self.__class__.__name__))
    
    def load_file(self, file_path:str) -> list:
        """ Loads an SDE file
        
        This loads a .yaml SDE file and converts it to a
        Python list format.
        
        Parameters
        ----------
        file_path: str
            Path to the .yaml file to be processed
            
        Returns
        -------
        list
            List of items loaded from the .yaml file. May return
            a dict that the child class will continue to format.
        """
        
        self._msg('Loading file...')
        
        load_path = self.load_path.format(
            sde_path=self.sde_path,
            file_path=file_path
        )
        with open(load_path) as file: raw_data = yaml.load(file, Loader=yaml.CLoader)
            
        return raw_data
    
    def flatten_data(self, raw_data:list, tqdm_leave=False) -> list:
        """ Converts a list of dictionary items to flat format
        
        Takes a list of dictionaries and converts those dictionaries
        to flat format.
        
        Parameters
        ----------
        raw_data: list
            List of dictionaries to flatten
        tqdm_leave: bool, optional
            If verbose is True, controls whether or not the TQDM
            iterator stays after completing (default False)
            
        Returns
        -------
        list
            List of flattened dictionary items
        """
        
        self._msg('Flattening data...')
        
        flat_data = []
        for item in self._tqdm(raw_data, leave=tqdm_leave):
            flat_data.append(self._flatten_item(item))
            
        return flat_data
    
    def _flatten_item(self, item:dict, _header='') -> dict:
        """ Recursive dictionary flattener
        
        Recursively flattens dictionary items. Called from the
        flatten_data method.
        
        Parameters
        ----------
        item: dict or list
            Item to flatten. If called to start process should
            be called with a dict, not a list.
        _header: str
            For tracking the path of the flattener, do not use
            
        Returns
        -------
        dict
            Flattened dictionary item
        """
        flat_item = {}
        if type(item) is dict:
            for key, value in item.items():
                flat_item = {
                    **flat_item,
                    **self._flatten_item(value, _header='%s.%s' % (_header, key))
                }
        elif type(item) is list:
            for i in range(len(item)):
                flat_item = {
                    **flat_item,
                    **self._flatten_item(item[i], _header='%s.%s' % (_header, i))
                }
        else:
            flat_item[_header[1:]] = item

        return flat_item
    
    def frame_construct(self, flat_data:list, renames:dict) -> pd.DataFrame:
        """ Constructs DataFrame from flattened dictionaries
        
        Converts a list of dictionaries and converts them to
        a Pandas DataFrame, as well as renames the columns
        for proper inserting into MariaDB.
        
        Parameters
        ----------
        flat_data: list
            List of flat dictionaries to convert
        renames: dict
            Dictionary containing flat -> MariaDB mappings
            
        Returns
        -------
        DataFrame
            Dataframe with MariaDB insert-ready columns
        """
        
        self._msg('Constructing DataFrame...')
        
        data_frame = pd.DataFrame(flat_data)
        data_frame['sde_version'] = self.sde_version
        data_frame.rename(columns=renames, inplace=True)
        return data_frame
    
    def upload_data(self, data_frame:pd.DataFrame, data_table:str):
        """ Controls data upload process
        
        Initializes & closes the MariaDB connection, as well as
        controlling the deletion and insert of the EVE SDE data.
        
        Parameters
        ----------
        data_frame: DataFrame
            Pandas DataFrame for inserting into MariaDB
        data_tabme: str
            Table name to drop and insert records into
        """
        
        self._msg('Uploading data...')
        
        self.init_maria(self.maria_login_path)
        self.delete_data(data_table)
        self.insert_data(data_frame, data_table)
        self.close_maria()
        
    def init_maria(self, maria_login_path:str):
        """ Connects to the MariaDB database
        
        Using the maria_login_path .json file, connects
        to the MariaDB database and stores the connection
        as a class parameter
        
        Parameters
        ----------
        maria_login_path: str
            Path to the MariaDB login settings/credentials,
            stored as a .json file
        """
        
        with open(maria_login_path) as file:
            self.conn['maria'] = mdb.connect(**js.load(file))
        
    def delete_data(self, data_table:str):
        """ Drops all data from the specified table
        
        Deletes all records from the specified table,
        in prep for the new records.
        
        Parameters
        ----------
        data_table: str
            Table to drop records from
        """
        
        cur = self.conn['maria'].cursor()
        cur.execute(self.sql['delete'].format(table=data_table))
        self.conn['maria'].commit()
        cur.close()
    
    def insert_data(self, data_frame:pd.DataFrame, data_table:str, tqdm_leave=False):
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
        
        upsert = ' ON DUPLICATE KEY UPDATE {upsert}'.format([
            '{col}=VALUES({col})'.format(col=col)
            for col in data_frame.columns
        ]) if self.upsert else ''
        
        insert_script = self.sql['insert'].format(
            table=data_table,
            cols=','.join(data_frame.columns),
            vals=','.join(['%s'] * data_frame.columns.size),
            upsert=upsert
        )
        
        data_list = data_frame.where(pd.notnull(data_frame), None).values.tolist()
        data_list = [
            data_list[i:i + self.commit_rows]
            for i in range(0, len(data_list), self.commit_rows)
        ]
        
        cur = self.conn['maria'].cursor()
        for insert_rows in self._tqdm(data_list, leave=tqdm_leave):
            cur.executemany(insert_script, insert_rows)
            self.conn['maria'].commit()
        cur.close()
         
    def close_maria(self):
        """ Closes the MariaDB connection
        
        Closes the MariaDB connection after all operations
        are complete.
        """
        
        self.conn['maria'].close()
import mysql.connector as sql
import yaml
import ujson as js

class ParserRoot(object):
    file_path = 'sde'
    file_name = ''
    sql_settings_path = 'database_login.json'
    parse_structure = {
        'root': {
            'sequence': ('{SDE',),
            'sub_parse': (),
            'sql': {
                'table': '',
                'cols': ('sde_version',)
            }
        }
    }
    sql_scripts = {
        'root': {
            'insert': 'INSERT INTO %s (%s) VALUES (%s);',
            'upsert': 'INSERT INTO %s (%s) VALUES (%s) ON DUPLICATE KEY UPDATE %s;',
            'delete': 'DELETE FROM %s;'
        }
    }
    
    def __init__(self, sde_version, start_active = True, parser = False, splice_size = 1000):
        self.splice_size = splice_size
        self.sde_version = sde_version
        if start_active:
            if parser:
                self.run_parser()
            else:
                self.run_process()
                
    def run_parser(self):
        file_data = self.load_file()
        parsed_structure = self.parse_file(file_data)
        print(parsed_structure)
        
    def load_file(self):
        with open('%s/%s' % (self.file_path, self.file_name), mode = 'r', encoding = 'utf-8') as file_obj:
            file_data = yaml.load(file_obj)
            
        return file_data
    
    def parse_file(self, parse_item, dict_item = {}):
        
        dict_item[type(parse_item).__name__] = dict_item.get(type(parse_item).__name__, {'count': 0})
        dict_item[type(parse_item).__name__]['count'] += 1
        
        if type(parse_item) is dict:
            dict_item[type(parse_item).__name__]['values'] = dict_item[type(parse_item).__name__].get('values', {})
            for key, value in parse_item.items():
                if type(key) is str:
                    dict_item[type(parse_item).__name__]['values'][key] = self.parse_file(
                        value, dict_item = dict_item[type(parse_item).__name__]['values'].get(key, {})
                    )
                else:
                    dict_item[type(parse_item).__name__]['values'] = self.parse_file(
                        value, dict_item = dict_item[type(parse_item).__name__]['values']
                    )
        elif type(parse_item) is list:
            dict_item[type(parse_item).__name__]['values'] = dict_item[type(parse_item).__name__].get('values', {})
            for value in parse_item:
                dict_item[type(parse_item).__name__]['values'] = self.parse_file(
                    value, dict_item = dict_item[type(parse_item).__name__]['values']
                )                
                    
        return dict_item

    def run_process(self):
        file_data = self.load_file()
        self.parse_data(file_data)
        self.upload_data()
        
    def parse_data(self, file_data):
        self.key_items = {}
        self.parsed_data = {}
        self.travel_row(file_data)
        
    def travel_row(self, file_data, working_level = 'root'):
        if working_level not in self.parsed_data.keys():
            self.parsed_data[working_level] = []
        
        if type(file_data) is dict:
            for key, value in file_data.items():
                self.process_row(value, working_level, key = key)
        if type(file_data) in (list, tuple):
            for value in file_data:
                self.process_row(value, working_level)
    
    def process_row(self, value, working_level, key = None):
        if key is not None: self.key_items[working_level] = key
        
        parse_row = [self.travel_item(path, value, self.key_items, working_level) for path in self.parse_structure[working_level]['sequence']]
        self.parsed_data[working_level].append(tuple(parse_row))
        
        if self.parse_structure[working_level].get('sub_parse', None) is not None:
            for sub_key in self.parse_structure[working_level]['sub_parse']:
                sub_data = value.get(sub_key, None)
                if sub_data is None: continue
                self.travel_row(sub_data, working_level = sub_key)
    
    def travel_item(self, path, dict_value, key_items, working_level):
        
        if path == '{SDE':
            parsed_item = self.sde_version
        elif path.startswith('{KEY_'):
            key_path = path.split('_')[1]
            parsed_item = key_items[key_path]
        else:
            parsed_item = self.walk_dot(dict_value, path)
        
        if self.parse_structure[working_level].get('replace', {}).get(path, None) is not None:
            parsed_item = self.replace_item(parsed_item, working_level, path)
        
        return parsed_item
    
    def walk_dot(self, dict_item, dot_path):
        path_items = dot_path.split('.')
        for path_item in path_items:
            dict_item = dict_item.get(path_item, None)
            if dict_item is None: break

        return dict_item

    def replace_item(self, parsed_item, working_level, path):
        item_index = [replace_item['actual'] for replace_item in self.parse_structure[working_level]['replace'][path]].index(parsed_item)
        parsed_item = self.parse_structure[working_level]['replace'][path][item_index]['new']
        return parsed_item
            
    def upload_data(self):
        self.connect_sql()
        self.insert_cycler()
        self.close_sql()
    
    def connect_sql(self):
        
        def build_sql_conn(file_path):
            with open(file_path) as sql_file:
                sql_conn_params = js.load(sql_file)

            sql_conn = sql.connect(**sql_conn_params)
            return sql_conn
        
        self.sql_conn = build_sql_conn(self.sql_settings_path)
        self.sql_cur = self.sql_conn.cursor()
    
    def insert_cycler(self):
        for key, value in self.parse_structure.items():
            parsed_data = self.parsed_data[key]
            
            if value['sql'].get('insert_script', None) is None:
                insert_script = self.walk_dot(self.sql_scripts, 'root.insert')
            else:
                insert_script = self.walk_dot(self.sql_scripts, value['sql']['insert_script'])
                
            if value['sql'].get('delete_script', None) is None:
                delete_script = self.walk_dot(self.sql_scripts, 'root.delete')
            else:
                delete_script = self.walk_dot(self.sql_scripts, value['sql']['delete_script'])
            
            self.delete_table(delete_script, value['sql'])
            self.insert_data(parsed_data, insert_script, value['sql'])
            
    def delete_table(self, delete_script, sql_items):
        sql_script = delete_script % sql_items['table']
        self.sql_cur.execute(sql_script)
        self.sql_conn.commit()
    
    def insert_data(self, parsed_data, insert_script, sql_items):
        upsert = sql_items.get('upsert', False)
        sql_script = self.build_insert_script(insert_script, sql_items, upsert = upsert)
        splice = -1
        for splice in range(len(parsed_data) // self.splice_size):
            self.sql_cur.executemany(sql_script, parsed_data[self.splice_size * splice:self.splice_size * (splice + 1)])
            self.sql_conn.commit()
            
        self.sql_cur.executemany(sql_script, parsed_data[self.splice_size * (splice + 1):])
        self.sql_conn.commit()
            
    def build_insert_script(self, sql_base, sql_items, upsert = False):
        if upsert:
            sql_script = sql_base % (
                sql_items['table'],
                ','.join(sql_items['cols']),
                ','.join(('%s',) * len(sql_items['cols'])),
                ','.join(['%s=VALUES(%s)' % ((col,) * 2) for col in sql_items['cols']]),
            )
        else:
            sql_script = sql_base % (
                sql_items['table'],
                ','.join(sql_items['cols']),
                ','.join(('%s',) * len(sql_items['cols']))
            )
        
        return sql_script
    
    def close_sql(self):
        self.sql_cur.close()
        self.sql_conn.close()
import ujson as js
import mysql.connector as mdb
import pandas as pd

def load_bpos():
    with open('./sql.json') as file:
        sql_scripts = js.load(file)

    with open('./../settings/maria_login.json') as file:
        conn = mdb.connect(**js.load(file))
        
    bpos = {'corp': pd.read_sql(sql_scripts['corp_bps'], conn, index_col = 'bp_item_id')}

    bpos['root'] = pd.read_sql(
        sql_scripts['root'].format(
            type_ids=','.join([str(type_id) for type_id in bpos['corp']['bp_type_id']])
        ), conn, index_col='bp_type_id'
    )

    bpos['acts'] = pd.read_sql(
        sql_scripts['acts'].format(
            type_ids=','.join([str(type_id) for type_id in bpos['corp']['bp_type_id']]),
            act_ids='1'
        ), conn
    )

    bpos['mats'] = pd.read_sql(
        sql_scripts['mats'].format(
            type_ids=','.join(bpos['acts']['bp_type_id'].astype(str)),
            act_ids='1'
        ), conn
    )
    
    bpos['prods'] = pd.read_sql(
        sql_scripts['prods'].format(
            type_ids=','.join(bpos['acts']['bp_type_id'].astype(str)),
            act_ids='1'
        ), conn
    )

    return bpos
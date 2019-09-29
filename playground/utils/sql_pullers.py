import pandas as pd
import numpy as np
import mysql.connector as mdb
import ujson as js

def get_types(type_ids, maria_path='./../settings/maria_login.json'):
    if len(type_ids) == 0:
        types = pd.DataFrame(columns = ['type_name', 'group_name', 'category_name'])
    else:
        with open(maria_path) as file:
            conn = mdb.connect(**js.load(file))
        
        types = pd.read_sql("""\
        SELECT Types.type_id,
            Types.type_name,
            Grp.group_name,
            Cat.category_name
        FROM Types
        JOIN TypeGroups AS Grp
            ON Types.group_id = Grp.group_id
        JOIN TypeCategories AS Cat
            ON Grp.category_id = Cat.category_id
        WHERE Types.type_id IN ({type_ids})
        ;""".format(
            type_ids=','.join(np.array(type_ids).astype(str))
        ), conn, index_col='type_id')
        
        conn.close()
        
    return types
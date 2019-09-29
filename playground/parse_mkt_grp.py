import ujson as js
import mysql.connector as mdb
import pandas as pd
import numpy as np

def parse_mkt_grp(mkt_grp_ids, conn=None, maria_path='./../settings/maria_login.json'):
    if conn is None:
        root_flag = True
        with open(maria_path) as file:
            conn = mdb.connect(**js.load(file))
    else:
        root_flag = False
    
    type_data = [pd.read_sql("""\
    SELECT Types.type_id,
        Types.type_name,
        Types.market_group_id,
        Types.volume,
        Types.mass,
        Types.portion_size
    FROM Types
    WHERE Types.market_group_id IN ({mkt_grp_ids})
        AND Types.published = 1
    ;""".format(
        mkt_grp_ids=','.join(np.array(mkt_grp_ids).astype(str))
    ), conn, index_col='type_id')]
    
    sub_grps = pd.read_sql("""\
    SELECT MktGrp.market_group_id,
        MktGrp.market_group_name
    FROM TypeMarketGroups AS MktGrp
    WHERE MktGrp.parent_group_id IN ({mkt_grp_ids})
    ;""".format(
        mkt_grp_ids=','.join(np.array(mkt_grp_ids).astype(str))
    ), conn, index_col='market_group_id')
    
    if len(sub_grps) > 0:
        type_data.append(parse_mkt_grp(sub_grps.index.values, conn=conn))

    type_data = pd.concat(type_data, axis=0)
    
    if root_flag: conn.close()
    
    return type_data
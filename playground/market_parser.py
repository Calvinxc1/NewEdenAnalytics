import mysql.connector as mdb
import pandas as pd
import numpy as np
import tqdm
import ujson as js
from datetime import date
from datetime import datetime as dt

from smoothers import market_smoother
from Pert import PERT
#%%
def print_timestamp(msg):
    message = '{timestamp}: {msg}'.format(
        timestamp=dt.now().isoformat(' '),
        msg=msg
    )
    print(message)
#%%
def market_smooth(region_ids, type_ids, horizons,
                  verbose=False, start_date=date(2015,4,1),
                  smoother=market_smoother, smoother_kwargs={}
                 ):
    if type(region_ids) in (str, int): region_ids = [region_ids]
    if type(type_ids) in (str, int): type_ids = [type_ids]
    if type(horizons) in (int,): horizons = [horizons]
    if type(start_date) in(str,): start_date = dt.strptime(start_date, '%Y-%m-%d').date()
        
    market_data = load_market(region_ids, type_ids, start_date=start_date, verbose=verbose)
    data_matrix, data_dims = clean_market(market_data, verbose=verbose)
    
    smooths = {}
    for h in horizons:
        if verbose: print_timestamp('Smoothing Market Data, Horizon {h}.'.format(h=h))
        smooths[h] = smoother(data_matrix, h, verbose=verbose, **smoother_kwargs)
        
    data_vals = form_data(data_matrix, data_dims, smooths, verbose=verbose)
    
    if verbose: print_timestamp('Market Data Prepared.')
    
    return data_vals

def load_market(region_ids, type_ids, start_date=date(2015,4,1), verbose=False, maria_path='./../settings/maria_login.json'):
    if type(region_ids) in (str, int): region_ids = [region_ids]
    if type(type_ids) in (str, int): type_ids = [type_ids]
    
    if verbose: print_timestamp('Retrieving Market Data. {regions} Region(s), {types} Type(s). Starting from {date}.'.format(
        regions=len(region_ids), types=len(type_ids), date=start_date.strftime('%Y-%m-%d')
    ))
    
    with open(maria_path) as file:
        conn = mdb.connect(**js.load(file))
        
    market_data = pd.read_sql("""\
        SELECT Market.record_date,
            Market.region_id,
            Market.type_id,
            Market.volume,
            Market.order_count,
            Market.low_price,
            Market.avg_price,
            Market.high_price
        FROM MarketHistory AS Market
        JOIN Types
            ON Market.type_id = Types.type_id
        WHERE Market.type_id IN ({type_ids})
            AND Market.region_id IN ({region_ids})
            AND Market.record_date >= '{start_date}'
        ;""".format(
            type_ids=','.join(np.array(type_ids).astype(str)),
            region_ids=','.join(np.array(region_ids).astype(str)),
            start_date=start_date.strftime('%Y-%m-%d')
        ), conn
    )
    
    return market_data

def clean_market(market_data, verbose=False,
                 time_col='record_date', group_cols=['region_id', 'type_id'],
                 data_cols=['volume', 'order_count', 'low_price', 'avg_price', 'high_price']
                ):
    if verbose: print_timestamp('Cleaning Market Data.')
    
    group_vals = [market_data[col].unique() for col in group_cols]
    date_anchor = pd.DataFrame(index=pd.date_range(market_data[time_col].min(), market_data[time_col].max()))
    data_matrix = np.empty((date_anchor.index.size, len(data_cols), *[cols.size for cols in group_vals]))
    data_dims = [date_anchor.index, data_cols, *group_vals]
    
    for group, data in market_data.groupby(group_cols):
        group_idx = [np.where(vals == val)[0][0] for vals, val in zip(group_vals, group)]
        data = date_anchor.join(data.set_index('record_date')[data_cols], how='left')
        data['volume'] = data['volume'].fillna(0)
        data = data.fillna(method='ffill').fillna(method='bfill')
        data_matrix[:,:,group_idx[0],group_idx[1]] = data.values
        
    return (data_matrix, data_dims)

def form_data(data_matrix, data_dims, smooths, verbose=False):
    if verbose: print_timestamp('Formatting Market Data.')
    
    data_vals = {'index': data_dims[0]}
    
    t1 = tqdm.tnrange(data_dims[2].size, leave=False) if verbose else range(data_dims[2].size)
    for region_idx in t1:
        data_vals[data_dims[2][region_idx]] = {}
        
        t2 = tqdm.tnrange(data_dims[3].size, leave=False) if verbose else range(data_dims[3].size)
        for type_idx in t2:
            actuals = pd.DataFrame(
                data_matrix[:,:,region_idx,type_idx],
                index=data_dims[0], columns=data_dims[1]
            )
            data_vals[data_dims[2][region_idx]][data_dims[3][type_idx]] = {
                0: {
                    'level': actuals,
                    'trend': actuals.diff(1).fillna(0),
                    'pert': PERT(*[actuals[col] for col in ['low_price', 'avg_price', 'high_price']])
                }
            }
            for h, smooth_data in smooths.items():
                data_vals[data_dims[2][region_idx]][data_dims[3][type_idx]][h] = {}
                for key, val in smooth_data.items():
                    data_vals[data_dims[2][region_idx]][data_dims[3][type_idx]][h][key] = pd.DataFrame(
                        val[:,:,region_idx,type_idx],
                        index=data_dims[0], columns=data_dims[1]
                    )
                data_vals[data_dims[2][region_idx]][data_dims[3][type_idx]][h]['pert'] = PERT(*[
                    data_vals[data_dims[2][region_idx]][data_dims[3][type_idx]][h]['level'][col]
                    for col in ['low_price', 'avg_price', 'high_price']
                ])
                
    return data_vals
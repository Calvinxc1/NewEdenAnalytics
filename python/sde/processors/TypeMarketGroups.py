import pandas as pd
import numpy as np

from processors.SDE import SdeProcessor

class TypeMarketGroupsProcessor(SdeProcessor):
    """Processor for the marketGroups file in the EVE SDE
    
    Processor controlling the loading of all EVE SDE
    Market Groups. Draws from SdeProcessor.
    
    See SdeProcessor for Parameters & Attributes.
    
    Version History:
        0.1 (2019-09-29) - First working iteration.
    """
    
    data_table = 'TypeMarketGroups'
    file_path = 'fsd/marketGroups.yaml'
    renames = {
        'marketGroupID': 'market_group_id',
        'name': 'market_group_name',
        'description': 'market_group_desc',
        'parentGroupID': 'parent_group_id',
        'iconID': 'icon_id',
        'hasTypes': 'has_types'
    }
    sql = {
        **SdeProcessor.sql,
        'market_seed': 'SELECT market_group_id FROM TypeMarketGroups;',
        'market_path': """\
            SELECT MktGrp.market_group_id,
                MktGrp.market_group_name,
                MktGrp.parent_group_id
            FROM TypeMarketGroups AS MktGrp
            WHERE MktGrp.market_group_id IN ({mkt_grp_ids})
        ;""",
        'market_update': 'UPDATE TypeMarketGroups SET path=%s WHERE market_group_id=%s;'
    }
    
    def load_file(self, file_path:str) -> list:
        """ Modified load_file for market group data
        
        Modified load_file method from SdeProcessor
        specificely designed for the market group
        data raw format.
        
        Parameters
        ----------
        file_path: str
            Path to the .yaml file to be processed
            
        Returns
        -------
        list
            List of items loaded from the .yaml file
        """
        
        raw_data = super().load_file(file_path)
        
        formatted_data = []
        for market_group_id, market_group_data in self._tqdm(raw_data.items()):
            market_group_data = self.parse_category(market_group_data, market_group_id)
            formatted_data.append(market_group_data)
            
        return formatted_data
    
    def parse_category(self, market_group_data:dict, market_group_id:int) -> dict:
        """ Parser for category data
        
        Parses a single market group record to get it to a
        flattenable format.
        
        Parameters
        ----------
        market_group_data: dict
            Data for market group to be parsed
        market_group_id: int
            Id value for market group being parsed
            
        Returns
        -------
        dict
            Parsed market group data
        """
        
        market_group_data['marketGroupID'] = market_group_id
        market_group_data['name'] = market_group_data.get('nameID', {}).pop('en', None)
        market_group_data['description'] = market_group_data.get('descriptionID', {}).pop('en', None)
        
        _ = market_group_data.pop('nameID', None)
        _ = market_group_data.pop('descriptionID', None)
        
        return market_group_data
    
    def upload_data(self, data_frame:pd.DataFrame, data_table:str):
        """ Modified upload_data for market group data
        
        Modified upload_data method from SdeProcessor
        specificely designed for the market group
        data, running the update_market method after
        regular data insert.
        
        Parameters
        ----------
        data_frame: DataFrame
            Pandas DataFrame for inserting into MariaDB
        data_table: str
            Table name to drop and insert records into
        """
        
        self._msg('Uploading data...')
        
        self.init_maria(self.maria_login_path)
        self.delete_data(data_table)
        self.insert_data(data_frame, data_table)
        self.update_market()
        self.close_maria()
    
    def update_market(self):
        mkt_grp_data = self.parse_market_path()
        self.update_market_groups(mkt_grp_data)
    
    def parse_market_path(self):
        seed_ids = pd.read_sql(self.sql['market_seed'], self.conn['maria'])['market_group_id'].values
        mkt_grp_data = self._parse_market(seed_ids)
        mkt_grp_data['path'] = mkt_grp_data['market_group_name']

        update_mask = pd.notnull(mkt_grp_data['parent_group_id'])
        parent_ids = mkt_grp_data.loc[update_mask, 'parent_group_id'].unique()

        while parent_ids.size > 0:
            mkt_grp_data_parent = self._parse_market(parent_ids)

            mkt_grp_data.loc[update_mask, 'path'] = mkt_grp_data.loc[
                update_mask,
                'parent_group_id'
            ].map(mkt_grp_data_parent['market_group_name']) + '.' + mkt_grp_data.loc[update_mask, 'path']

            mkt_grp_data['parent_group_id'] = mkt_grp_data['parent_group_id'].map(mkt_grp_data_parent['parent_group_id'])

            update_mask = pd.notnull(mkt_grp_data['parent_group_id'])
            parent_ids = mkt_grp_data.loc[update_mask, 'parent_group_id'].unique()

        return mkt_grp_data.reset_index()[['path', 'market_group_id']]
    
    def _parse_market(self, mkt_grp_ids):
        sql_script = self.sql['market_path'].format(mkt_grp_ids=','.join(mkt_grp_ids.astype(str)))
        mkt_grp_data = pd.read_sql(sql_script, self.conn['maria'], index_col = 'market_group_id')
        return mkt_grp_data
    
    def update_market_groups(self, mkt_grp_data):
        cur = self.conn['maria'].cursor()
        cur.executemany(self.sql['market_update'], mkt_grp_data.values.tolist())
        self.conn['maria'].commit()
        cur.close()
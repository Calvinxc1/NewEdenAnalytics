from processors.SDE import SdeProcessor

class TypeGroupsProcessor(SdeProcessor):
    """Processor for the groupIDs file in the EVE SDE
    
    Processor controlling the loading of all EVE SDE
    Type Groups. Draws from SdeProcessor.
    
    See SdeProcessor for Parameters & Attributes.
    
    Version History:
        0.1 (2019-09-29) - First working iteration.
    """
    
    data_table = 'TypeGroups'
    file_path = 'fsd/groupIDs.yaml'
    renames = {
        'groupID': 'group_id',
        'name': 'group_name',
        'categoryID': 'category_id',
        'iconID': 'icon_id',
        'anchorable': 'anchorable',
        'anchored': 'anchored',
        'fittableNonSingleton': 'fittable_non_singleton',
        'published': 'published',
        'useBasePrice': 'use_base_price'
    }
    
    def load_file(self, file_path:str) -> list:
        """ Modified load_file for group data
        
        Modified load_file method from SdeProcessor
        specificely designed for the group data raw
        format.
        
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
        for group_id, group_data in self._tqdm(raw_data.items()):
            group_data = self.parse_group(group_data, group_id)
            formatted_data.append(group_data)
            
        return formatted_data
    
    def parse_group(self, group_data:dict, group_id:int) -> dict:
        """ Parser for group data
        
        Parses a single group record to get it to a
        flattenable format.
        
        Parameters
        ----------
        group_data: dict
            Data for group to be parsed
        group_id: int
            Id value for group being parsed
            
        Returns
        -------
        dict
            Parsed group data
        """
        
        group_data['groupID'] = group_id
        group_data['name'] = group_data.get('name', {}).pop('en', None)
        
        return group_data
from processors.SDE import SdeProcessor

class TypesProcessor(SdeProcessor):
    """Processor for the typeIDs file in the EVE SDE
    
    Processor controlling the loading of all EVE SDE
    types. Draws from SdeProcessor.
    
    See SdeProcessor for Parameters & Attributes.
    
    TODO: Parse masteries data
    TODO: Parse traits data
    
    Version History:
        0.1.1 (2019-09-29) - Renamed parse_types method to parse_type
            and corrected class docstring.
        0.1 (2019-09-29) - First working iteration.
    """
    
    data_table = 'Types'
    file_path = 'fsd/typeIDs.yaml'
    renames = {
        'typeID': 'type_id', 'name': 'type_name', 'description': 'type_desc',
        'groupID': 'group_id', 'marketGroupID': 'market_group_id',
        'factionID': 'faction_id', 'graphicID': 'graphic_id',
        'iconID': 'icon_id', 'metaGroupID': 'meta_group_id',
        'sofMaterialSetID': 'sof_material_set_id', 'sofFactionName': 'sof_faction_name',
        'soundID': 'sound_id', 'raceID': 'race_id', 'variationParentTypeID': 'var_parent_type_id',
        'basePrice': 'base_price', 'capacity': 'capacity', 'mass': 'mass',
        'portionSize': 'portion_size', 'radius': 'radius',
        'volume': 'volume', 'published': 'published'
    }
    
    def load_file(self, file_path:str) -> list:
        """ Modified load_file for type data
        
        Modified load_file method from SdeProcessor
        specificely designed for the type data raw
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
        for type_id, type_data in self._tqdm(raw_data.items()):
            type_data = self.parse_type(type_data, type_id)
            formatted_data.append(type_data)
            
        return formatted_data
    
    def parse_type(self, type_data:dict, type_id:int) -> dict:
        """ Parser for type data
        
        Parses a single type record to get it to a
        flattenable format.
        
        Parameters
        ----------
        type_data: dict
            Data for type to be parsed
        type_id: int
            Id value for type being parsed
            
        Returns
        -------
        dict
            Parsed type data
        """
        
        type_data['typeID'] = type_id
        type_data['name'] = type_data.get('name', {}).pop('en', None)
        type_data['description'] = type_data.get('description', {}).pop('en', None)
        
        _ = type_data.pop('masteries', None)
        _ = type_data.pop('traits', None)
        
        return type_data
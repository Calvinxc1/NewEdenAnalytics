from processors.SDE import SdeProcessor

class TypeCategoriesProcessor(SdeProcessor):
    """Processor for the categoryIDs file in the EVE SDE
    
    Processor controlling the loading of all EVE SDE
    Type Categories. Draws from SdeProcessor.
    
    See SdeProcessor for Parameters & Attributes.
    
    Version History:
        0.1 (2019-09-29) - First working iteration.
    """
    
    data_table = 'TypeCategories'
    file_path = 'fsd/categoryIDs.yaml'
    renames = {
        'categoryID': 'category_id',
        'name': 'category_name',
        'iconID': 'icon_id',
        'published': 'published'
    }
    
    def load_file(self, file_path:str) -> list:
        """ Modified load_file for category data
        
        Modified load_file method from SdeProcessor
        specificely designed for the category data raw
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
        for category_id, category_data in self._tqdm(raw_data.items()):
            category_data = self.parse_category(category_data, category_id)
            formatted_data.append(category_data)
            
        return formatted_data
    
    def parse_category(self, category_data:dict, category_id:int) -> dict:
        """ Parser for category data
        
        Parses a single group record to get it to a
        flattenable format.
        
        Parameters
        ----------
        category_data: dict
            Data for category to be parsed
        category_id: int
            Id value for category being parsed
            
        Returns
        -------
        dict
            Parsed category data
        """
        
        category_data['categoryID'] = category_id
        category_data['name'] = category_data.get('name', {}).pop('en', None)
        
        return category_data
from processors.SDE import SdeProcessor

class NamesProcessor(SdeProcessor):
    """Processor for the invNames file in the EVE SDE
    
    Processor controlling the loading of all EVE SDE
    item names. Draws from SdeProcessor.
    
    See SdeProcessor for Parameters & Attributes.
    
    Version History:
        0.1 (2019-09-29) - First working iteration
    """
    
    commit_rows = 100000
    data_table = 'ItemNames'
    file_path = 'bsd/invNames.yaml'
    renames = {
        'itemID': 'name_id',
        'itemName': 'item_name'
    }
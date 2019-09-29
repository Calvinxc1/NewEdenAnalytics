from processors.SDE import SdeProcessor

class IndustryActivityProcessor(SdeProcessor):
    """Processor for the ramActivities file
    
    Processor controlling the loading of all EVE SDE
    industry activities.
    
    See SdeProcessor for Parameters & Attributes.
    
    Version History:
        0.1 (2019-09-29) - First working iteration
    """
    
    data_table = 'IndustryActivities'
    file_path = 'bsd/ramActivities.yaml'
    renames = {
        'activityID': 'activity_id',
        'activityName': 'activity_name',
        'description': 'activity_desc',
        'published': 'published',
        'iconNo': 'icon_no'
    }
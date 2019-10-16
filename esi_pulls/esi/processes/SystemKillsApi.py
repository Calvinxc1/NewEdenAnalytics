from . import Api

RENAMES = {'timestamp': 'record_time'}
TABLE = 'MapKills'
URL = {'main': 'universe/system_kills'}

class SystemKillsApi(Api):
    def __init__(self, verbose=False):
        super().__init__(renames=RENAMES, table=TABLE, url=URL, verbose=verbose)
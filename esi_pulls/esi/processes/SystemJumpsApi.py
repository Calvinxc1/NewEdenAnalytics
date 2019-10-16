from . import Api

RENAMES = {'timestamp': 'record_time', 'ship_jumps': 'jumps'}
TABLE = 'MapJumps'
URL = {'main': 'universe/system_jumps'}

class SystemJumpsApi(Api):
    def __init__(self, verbose=False):
        super().__init__(renames=RENAMES, table=TABLE, url=URL, verbose=verbose)
from ..utils import Container

COMMIT_ROWS = 10000
EMAIL_LOGIN_PATH = './../settings/email.json'
ESI_RETRYS = 5
ETAG_TABLE = 'ETagRecord'
HEADERS = {'accept': 'application/json', 'Content-Encoding': 'gzip'}
MARIA_LOGIN_PATH = './../settings/maria_login.json'
MONGO_DB = 'NewEdenAnalytics'
MONGO_EXPIRE_COLL = 'esi_expires'
MONGO_LOGIN_PATH = './../settings/mongo_login.json'
PARAMS = {'datasource':'tranquility'}
SQL = dict(
    insert='INSERT INTO {table} ({cols}) VALUES ({vals}){upsert};',
    delete='DELETE FROM {table} WHERE {table}.{time_col} != {time};',
    purge='DELETE FROM {table};',
)
URL = dict(root='https://esi.evetech.net/latest')
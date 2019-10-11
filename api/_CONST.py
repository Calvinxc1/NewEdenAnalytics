from utils.Container import Container

COMMIT_ROWS = 10000
EMAIL_LOGIN_PATH = './../settings/email.json'
ESI_RETRYS = 5
ETAG_TABLE = 'ETagRecord'
HEADERS = {'accept': 'application/json', 'Content-Encoding': 'gzip'}
MARIA_LOGIN_PATH = './../settings/maria_login.json'
MONGO_DB = 'NewEdenAnalytics'
MONGO_EXPIRE_COLL = 'esi_expires'
MONGO_LOGIN_PATH = './../settings/mongo_login.json'
PAGE_MAX_POOL = 4
PARAMS = {'datasource':'tranquility'}
RENAMES = {}
SQL = Container(insert='INSERT INTO {table} ({cols}) VALUES ({vals}){upsert};')
TABLE = ''
UPSERT = True
URL = Container(root='https://esi.evetech.net/latest')
USE_TIMESTAMP = False
from esi import ApiController, processes as proc
from esi.utils import Container

processes = [
    Container(api=proc.MarketHistoryApi, expire_delay=600),
    Container(api=proc.ServerStatusApi, expire_delay=1),
    Container(api=proc.SystemJumpsApi, expire_delay=60),
    Container(api=proc.SystemKillsApi, expire_delay=60),
    Container(api=proc.MarketOrdersApi, expire_delay=3300),
    Container(api=proc.MarketPricesApi, expire_delay=60),
    Container(api=proc.CorpIndustryJobsApi, expire_delay=30),
    Container(api=proc.CorpWalletJournalApi, expire_delay=60),
    Container(api=proc.CorpWalletTransactionsApi, expire_delay=60),
    Container(api=proc.CorpMarketOrdersApi, expire_delay=30),
]

control = ApiController(processes)
control.launch_threads(control.processes)


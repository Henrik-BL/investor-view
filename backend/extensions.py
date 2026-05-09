import os
from hcnb_stock_data.hcnb_stock_data import HcnbStockData

uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
hcnb_stock_data = HcnbStockData(uri=uri)
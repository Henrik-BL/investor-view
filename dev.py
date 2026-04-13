from hcnb_stock_data.hcnb_stock_data import HcnbStockData

from backend.src.main_portfolio_evaluator import MainPortfolioEvaluator

main_portfolio_evaluator = MainPortfolioEvaluator()

hcnb_stock_data = HcnbStockData()

all_tickers = hcnb_stock_data.get_all_tickers()

ticker_list = ["PLTR", "AAPL", "MSFT", "GOOGL", "AMZN"]

evaluate_list = []

for item in ticker_list:
    stock_data = hcnb_stock_data.get_stock_data(item, False)
    stock_score = main_portfolio_evaluator.evaluate(stock_data)
    result_list = list(stock_score)
    result_list.append(item)

    evaluate_list.append(result_list)

evaluate_list.sort(key=lambda x: x[1], reverse=True)

for item in evaluate_list:
    print(item)


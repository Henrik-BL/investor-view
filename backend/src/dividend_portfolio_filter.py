from hcnb_stock_data.hcnb_stock_data import HcnbStockData

class DividendPortfolioFilter:
    def __init__(self, hcnb_stock_data: HcnbStockData):
        self.hcnb_stock_data = hcnb_stock_data
        self.dividend_req = 2.0
        self.ten_year_dividend_cagr_req = 3.0
        self.five_year_dividend_cagr_req = 3.0
        self.yearly_revenue_cagr_req = 3.0
        self.yearly_net_income_cagr_req = 3.0

    def get_list_matching_filters(self):
        result_list = []

        all_tickers = self.hcnb_stock_data.get_all_tickers()

        for ticker in all_tickers:
            stock_data = self.hcnb_stock_data.get_stock_data(ticker, False)

            if stock_data.dividend_yield and stock_data.ten_year_dividend_cagr and stock_data.yearly_revenue_cagr:

                if (stock_data.dividend_yield > self.dividend_req and
                        stock_data.ten_year_dividend_cagr > self.ten_year_dividend_cagr_req and
                        stock_data.five_year_dividend_cagr > self.five_year_dividend_cagr_req and
                        stock_data.yearly_revenue_cagr > self.yearly_revenue_cagr_req and
                        stock_data.yearly_net_income_cagr > self.yearly_net_income_cagr_req):
                    result_list.append([ticker, stock_data.name])

        return result_list


# dividend_portfolio_filter = DividendPortfolioFilter(HcnbStockData())
# print(dividend_portfolio_filter.get_list_matching_filters())


from hcnb_stock_data.models.stock_data import StockData


class MainPortfolioEvaluator:
    def __init__(self):
        self.result_list = []
        self.points = 0
        self.none_count = 0

    def evaluate(self, stock_data: StockData):
        self.result_list = []
        self.points = 0
        self.none_count = 0

        self.evaluate_revenue_growth(stock_data)
        self.evaluate_earnings_growth(stock_data)
        self.evaluate_gross_margins(stock_data)
        self.evaluate_last_quarter_margin(stock_data)

        self.evaluate_margin_yoy_change(stock_data)


        return self.result_list, self.points

    @staticmethod
    def _get_heavy_points(low, high, num):
        if num is None or high is None or low is None:
            return None

        if num < low:
            return 0

        if num > high:
            return 2.0

        # Starts at 1.0 at 'low', adds 0.1 for each unit
        return round(1.0 + (num - low) * 0.1, 1)


    def evaluate_revenue_growth(self, stock_data: StockData):
        result = self._get_heavy_points(15, 25, stock_data.revenue_growth)
        if result is None:
            self.none_count += 1
        else:
            self.points += result
        self.result_list.append(["Revenue Growth", stock_data.revenue_growth, result])

    def evaluate_earnings_growth(self, stock_data: StockData):
        result = self._get_heavy_points(15, 25, stock_data.earnings_growth)
        if result is None:
            self.none_count += 1
        else:
            self.points += result
        self.result_list.append(["Earnings Growth", stock_data.earnings_growth, result])

    def evaluate_gross_margins(self, stock_data: StockData):
        gross_margin = stock_data.gross_margins
        if gross_margin is not None:
            gross_margin = round(gross_margin * 100)

        result = self._get_heavy_points(20, 40, gross_margin)
        if result is None:
            self.none_count += 1
        else:
            self.points += result
        self.result_list.append(["Gross margin", gross_margin, result])

    def evaluate_last_quarter_margin(self, stock_data: StockData):
        result = self._get_heavy_points(10, 20, stock_data.last_quarter_margin)
        if result is None:
            self.none_count += 1
        else:
            self.points += result
        self.result_list.append(["Last quarter margin", stock_data.last_quarter_margin, result])

    def evaluate_margin_yoy_change(self, stock_data: StockData):
        result = self._get_heavy_points(3, 13, stock_data.margin_difference_yoy)
        if result is None:
            self.none_count += 1
        else:
            self.points += result
        self.result_list.append(["Margin yoy change", stock_data.last_quarter_margin, result])

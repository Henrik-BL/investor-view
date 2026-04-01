from hcnb_stock_data.models.stock_data import StockData


class MainPortfolioEvaluator:
    def __init__(self):
        self.heavy_metrics = [
            {
                "name": "revenue_growth",
                "low": 15,
                "high": 25
            },
            {
                "name": "earnings_growth",
                "low": 15,
                "high": 25
            },
            {
                "name": "gross_margins",
                "low": 30,
                "high": 40
            },
            {
                "name": "last_quarter_margin"
            }

        ]

    def evaluate(self, stock_data: StockData):
        point_list = []
        points = 0

        for metric in self.heavy_metrics:
            metric_value = getattr(stock_data, metric["name"])
            score = self._get_heavy_value(metric["low"], metric["high"], metric_value)
            points += score

            point_list.append([metric["name"], metric_value, score])

        return point_list, points

    @staticmethod
    def _get_heavy_value(low, high, num):
        if num < low:
            return 0

        if num > high:
            return 2.0

        # Starts at 1.0 at 'low', adds 0.1 for each unit
        return round(1.0 + (num - low) * 0.1, 1)
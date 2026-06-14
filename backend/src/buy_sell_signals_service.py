from hcnb_stock_data.hcnb_stock_data import HcnbStockData
from hcnb_stock_data.models.stock_data import StockData


class BuySellSignalsService:
    def __init__(self, hcnb_stock_data: HcnbStockData):
        self.fear_greed_data = hcnb_stock_data.get_fear_greed_index()
        self.buy_points = 0
        self.sell_points = 0
        self.buy_points_calculated = []
        self.sell_points_calculated = []
        self.neutral_or_missing_data = []

    def get_buy_sell_signal(self, stock_data: StockData):
        self.buy_points = 0
        self.sell_points = 0

        self.buy_points_calculated = []
        self.sell_points_calculated = []
        self.neutral_or_missing_data = []

        self._set_fear_greed_points()
        self._set_rsi_14_points(stock_data)
        self._set_ma_225_points(stock_data)

        return {
            "buy_points": self.buy_points,
            "sell_points": self.sell_points,
            "buy_points_calculated": self.buy_points_calculated,
            "sell_points_calculated": self.sell_points_calculated,
            "neutral_or_missing_data": self.neutral_or_missing_data,
        }

    def _set_fear_greed_points(self):
        if self.fear_greed_data is None:
            self.neutral_or_missing_data.append(["Fear & Greed Index Missing", self.fear_greed_data])
            return

        if self.fear_greed_data < 25:
            self.buy_points += 2
            self.buy_points_calculated.append(["Fear & Greed Index Buy 2", self.fear_greed_data])
        elif 25 <= self.fear_greed_data <= 45:
            self.buy_points += 1
            self.buy_points_calculated.append(["Fear & Greed Index Buy 1", self.fear_greed_data])
        elif 55 <= self.fear_greed_data <= 75:
            self.sell_points += 1
            self.sell_points_calculated.append(["Fear & Greed Index Sell 1", self.fear_greed_data])
        elif 75 <= self.fear_greed_data:
            self.sell_points += 2
            self.sell_points_calculated.append(["Fear & Greed Index Sell 2", self.fear_greed_data])

    def _set_rsi_14_points(self, stock_data: StockData):
        if stock_data.rsi_14 < 30:
            val = 2 if stock_data.rsi_14 < 20 else 1
            self.buy_points += val
            label = f"RSI 14 Buy {val}"
            self.buy_points_calculated.append([label, stock_data.rsi_14])
        elif stock_data.rsi_14 > 70:
            val = 2 if stock_data.rsi_14 > 80 else 1
            self.sell_points += val
            label = f"RSI 14 Sell {val}"
            self.sell_points_calculated.append([label, stock_data.rsi_14])
        else:
            label = "RSI 14 neutral"
            self.neutral_or_missing_data.append([label, stock_data.rsi_14])

    def _set_ma_225_points(self, stock_data: StockData):
        diff = stock_data.sma_225_diff
        if -50 <= diff <= -20:
            self.buy_points += 1
            label = f"SMA 225 diff buy 1"
            self.buy_points_calculated.append([label, stock_data.rsi_14])
        elif diff < -50:
            self.buy_points += 2
            label = f"SMA 225 diff buy 2"
            self.buy_points_calculated.append([label, stock_data.rsi_14])
        elif 50 <= diff < 80:
            self.sell_points += 1
            label = f"SMA 225 diff sell 1"
            self.sell_points_calculated.append([label, stock_data.rsi_14])
        elif diff >= 80:
            self.sell_points += 2
            label = f"SMA 225 diff sell 2"
            self.sell_points_calculated.append([label, stock_data.rsi_14])
        else:
            label = "SMA 225 diff neutral"
            self.neutral_or_missing_data.append([label, stock_data.rsi_14])

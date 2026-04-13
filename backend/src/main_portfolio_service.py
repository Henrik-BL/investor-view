import json
from pathlib import Path

from hcnb_stock_data.currency_service import CurrencyService
from hcnb_stock_data.hcnb_stock_data import HcnbStockData

from backend.src.buy_sell_signals_service import BuySellSignalsService


class MainPortfolioService:
    def __init__(self, hcnb_stock_data: HcnbStockData):
        self.hcnb_stock_data = hcnb_stock_data
        self.currency_service = CurrencyService()
        self.buy_sell_signals_service = BuySellSignalsService(self.hcnb_stock_data)
        self.portfolio_file_path = Path(__file__).resolve().parents[1] / 'portfolio_data' / 'main_portfolio.json'

    def get_portfolio_overview(self):
        total_value = 0
        portfolio_holding = self._load_portfolio_holdings()

        for holding in portfolio_holding:
            stock_data = self.hcnb_stock_data.get_stock_data(holding['ticker'], False)
            holding_value = stock_data.price * holding['quantity']
            holding_value_sek = round(self.currency_service.convert(holding_value, stock_data.currency, "SEK"))
            holding['holding_value_sek'] = holding_value_sek
            total_value += holding_value_sek
            holding['sector'] = stock_data.sector
            holding['industry'] = stock_data.industry
            holding['buy_sell_signals'] = self.buy_sell_signals_service.get_buy_sell_signal(stock_data)

        for holding in portfolio_holding:
            holding['holding_value_percentage'] = round((holding['holding_value_sek'] / total_value) * 100, 2) if total_value > 0 else 0

        sector_percentage = self._calculate_group_percentage(portfolio_holding, 'sector', total_value)
        industry_percentage = self._calculate_group_percentage(portfolio_holding, 'industry', total_value)

        portfolio_holding.sort(key=lambda item: item["holding_value_sek"], reverse=True)

        return {
            "total_value_sek": total_value,
            "holdings": portfolio_holding,
            "sector_percentage": sector_percentage,
            "industry_percentage": industry_percentage
        }

    @staticmethod
    def _calculate_group_percentage(holdings: list[dict], group_key: str, total_value: float) -> list[dict]:
        grouped_data = {}

        for holding in holdings:
            group_value = holding.get(group_key) or "Unknown"
            holding_value = holding.get('holding_value_sek', 0)
            ticker = holding.get('ticker')

            if group_value not in grouped_data:
                grouped_data[group_value] = {
                    "value_sek": 0,
                    "tickers": set(),
                }

            grouped_data[group_value]["value_sek"] += holding_value
            if ticker:
                grouped_data[group_value]["tickers"].add(ticker)

        result = []
        for group_value, data in grouped_data.items():
            value_sek = data["value_sek"]
            result.append({
                group_key: group_value,
                "value_sek": value_sek,
                "percentage": round((value_sek / total_value) * 100, 2) if total_value > 0 else 0,
                "tickers": sorted(data["tickers"]),
            })

        result.sort(key=lambda item: item["percentage"], reverse=True)
        return result

    def _load_portfolio_holdings(self) -> list[dict]:
        if not self.portfolio_file_path.exists():
            return []
        with self.portfolio_file_path.open('r', encoding='utf-8') as f:
            data = json.load(f)
        holdings = data.get('holdings', []) if isinstance(data, dict) else []
        aggregated_holdings = self._get_aggregated_holdings(holdings)
        return aggregated_holdings

    @staticmethod
    def _get_aggregated_holdings(holdings: list[dict]) -> list[dict]:
        aggregated = []
        unique_tickers = []

        for holding in holdings:
            ticker = str(holding.get('ticker', '')).strip()
            if not ticker:
                continue
            if ticker not in unique_tickers:
                unique_tickers.append(ticker)

        for ticker in unique_tickers:
            quantity = 0
            accounts = []
            for holding in holdings:
                holding_ticker = str(holding.get('ticker', '')).strip()
                if holding_ticker == ticker:
                    quantity += holding.get('quantity', 0)
                    accounts.append(holding.get('account', ''))

            aggregated.append({
                "ticker": ticker,
                "quantity": quantity,
                "accounts": accounts
            })

        return aggregated



# main_portfolio_service = MainPortfolioService(HcnbStockData())
# dd = main_portfolio_service.get_portfolio_overview()
# print("debug")

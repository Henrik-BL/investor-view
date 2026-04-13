import json
from pathlib import Path

from hcnb_stock_data.currency_service import CurrencyService
from hcnb_stock_data.hcnb_stock_data import HcnbStockData

from backend.src.tax_calculator import TaxCalculator


class DividendPortfolioService:

    def __init__(self, hcnb_stock_data: HcnbStockData):
        self.hcnb_stock_data = hcnb_stock_data
        self.currency_service = CurrencyService()
        self.portfolio_file_path = Path(__file__).resolve().parents[1] / 'portfolio_data' / 'dividend_portfolio.json'
        self.tickers_in_db = self.hcnb_stock_data.get_all_tickers()

    def get_portfolio_overview(self):
        total_portfolio_value = 0
        total_dividend_amount_sek = 0
        payouts = 0
        stocks_without_dividend = []
        portfolio_holding = self._load_portfolio_holdings()

        for holding in portfolio_holding:
            if not holding['ticker'] in self.tickers_in_db:
                self.hcnb_stock_data.get_stock_data(holding['ticker'], True)

            stock_data = self.hcnb_stock_data.get_stock_data(holding['ticker'], False)
            holding_value = stock_data.price * holding['quantity']
            holding_value_sek = round(self.currency_service.convert(holding_value, stock_data.currency, "SEK"))
            holding['holding_value_sek'] = holding_value_sek
            total_portfolio_value += holding_value_sek
            holding['sector'] = stock_data.sector
            holding['industry'] = stock_data.industry
            holding['dividend_yield'] = stock_data.dividend_yield
            holding['yearly_dividend_amount_sek'] = self._get_yearly_dividend_amount_sek(holding)


            payouts += holding['payouts'] if 'payouts' in holding else 0
            if holding['payouts'] == 0:
                stocks_without_dividend.append(holding['ticker'])
                holding['yearly_dividend_amount_sek'] = 0
                holding['dividend_yield'] = 0

            total_dividend_amount_sek += holding['yearly_dividend_amount_sek']

        for holding in portfolio_holding:
            holding['holding_value_percentage'] = round((holding['holding_value_sek'] / total_portfolio_value) * 100, 2) if total_portfolio_value > 0 else 0

        sector_percentage = self._calculate_group_percentage(portfolio_holding, 'sector', total_portfolio_value)
        industry_percentage = self._calculate_group_percentage(portfolio_holding, 'industry', total_portfolio_value)

        portfolio_holding.sort(key=lambda p_item: p_item["holding_value_sek"], reverse=True)

        return {
            "total_value_sek": total_portfolio_value,
            "holdings": portfolio_holding,
            "sector_percentage": sector_percentage,
            "industry_percentage": industry_percentage,
            "dividend_data": self._get_dividend_data(total_portfolio_value, payouts, total_dividend_amount_sek, stocks_without_dividend)
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

        result.sort(key=lambda sort_item: sort_item["percentage"], reverse=True)
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
            payouts = 4
            for holding in holdings:
                holding_ticker = str(holding.get('ticker', '')).strip()
                if holding_ticker == ticker:
                    quantity += holding.get('quantity', 0)
                    accounts.append(holding.get('account', ''))
                    payouts = holding.get('payouts', payouts)

            aggregated.append({
                "ticker": ticker,
                "quantity": quantity,
                "accounts": accounts,
                "payouts": payouts
            })

        return aggregated

    @staticmethod
    def _get_yearly_dividend_amount_sek(holding: dict) -> float:
        dividend_multiplier = holding['dividend_yield'] / 100
        dividend_yearly_amount_sek = round(holding['holding_value_sek'] * dividend_multiplier)
        return dividend_yearly_amount_sek

    @staticmethod
    def _get_dividend_data(total_portfolio_value: float,
                           payouts: int,
                           total_dividend_amount_sek: float,
                           stocks_without_dividend: list[str]) -> dict:
        monthly_divided = round(total_dividend_amount_sek / 12)
        daily_divided = round(total_dividend_amount_sek / 365)

        tax_amount = TaxCalculator.kf_yearly_fraction(total_portfolio_value)

        yearly_dividend_at = round(total_dividend_amount_sek - tax_amount)
        monthly_dividend_at = round(yearly_dividend_at / 12)
        daily_dividend_at = round(yearly_dividend_at / 365)


        return {
            "payouts": payouts,
            "yearly_dividend": total_dividend_amount_sek,
            "monthly_divided": monthly_divided,
            "daily_divided": daily_divided,
            "yearly_dividend_at": yearly_dividend_at,
            "monthly_dividend_at": monthly_dividend_at,
            "daily_dividend_at": daily_dividend_at,
            "stocks_without_dividend": stocks_without_dividend
        }

# dividend_portfolio_service = DividendPortfolioService(HcnbStockData())
#
# result_2 = dividend_portfolio_service.get_portfolio_overview()
#
# for item in result_2['holdings']:
#     print(item['dividend_yield'])
#     print(item['yearly_dividend_amount_sek'])

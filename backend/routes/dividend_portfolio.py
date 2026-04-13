from flask import Blueprint, jsonify

from backend.extensions import hcnb_stock_data
from backend.src.dividend_portfolio_service import DividendPortfolioService


dividend_portfolio_bp = Blueprint('dividend_portfolio', __name__, url_prefix='/api/dividend-portfolio')


@dividend_portfolio_bp.route('/overview', methods=['GET'])
def dividend_portfolio_overview():
    dividend_portfolio_service = DividendPortfolioService(hcnb_stock_data)
    portfolio_overview_json = dividend_portfolio_service.get_portfolio_overview()
    return jsonify(portfolio_overview_json), 200


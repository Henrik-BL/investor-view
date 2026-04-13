from flask import Blueprint, jsonify
from pathlib import Path

from backend.extensions import hcnb_stock_data
from backend.src.main_portfolio_service import MainPortfolioService

portfolio_bp = Blueprint('portfolio', __name__, url_prefix='/api/portfolio')

PORTFOLIO_FILE_PATH = Path(__file__).resolve().parents[1] / 'portfolio_data' / 'main_portfolio.json'


@portfolio_bp.route('/overview', methods=['GET'])
def portfolio_overview():
    main_portfolio_service = MainPortfolioService(hcnb_stock_data)
    portfolio_overview_json = main_portfolio_service.get_portfolio_overview()
    return jsonify(portfolio_overview_json), 200


from flask import Blueprint
from flask import request, jsonify, Response
import json

from backend.extensions import hcnb_stock_data

screener_bp = Blueprint('screener', __name__, url_prefix='/api/screener')

@screener_bp.route('/add_ticker', methods=['POST'])
def add_ticker():
    data = request.get_json()
    ticker_input = data.get('ticker')

    if not ticker_input:
        return jsonify({"Message": "No ticker provided"}), 400

    existing_tickers = hcnb_stock_data.get_all_tickers()

    if ticker_input.upper() in [ticker.upper() for ticker in existing_tickers]:
        return jsonify({"Message": "Ticker already exists"}), 400

    try:
        hcnb_stock_data.get_stock_data(ticker_input)
    except:
        return jsonify({"Message": f"Invalid ticker"}), 400

    return jsonify({ "Message": "Ticker added" })

@screener_bp.route('/screener_list', methods=['GET'])
def screener_list():
    tickers = hcnb_stock_data.get_all_tickers()
    screener_items = []
    for ticker in tickers:
        stock_data = hcnb_stock_data.get_stock_data(ticker, False)

        screener_items.append({
            "ticker": stock_data.ticker,
            "pe": stock_data.pe,
            "forward_pe": stock_data.forward_pe,
            "ps": stock_data.ps,
            "peg": stock_data.peg,
            "revenue_growth": stock_data.revenue_growth,
            "earnings_growth": stock_data.earnings_growth,
            "rsi_14": stock_data.rsi_14
        })

    return jsonify({ "screener_list": screener_items })

@screener_bp.route('/update_data', methods=['GET'])
def update_data():
    def event_stream():
        hcnb_stock_data.update_limit_hours = 1
        tickers = hcnb_stock_data.get_all_tickers()
        total = len(tickers)

        yield f"data: {json.dumps({'status': 'started', 'total': total})}\n\n"

        for index, ticker in enumerate(tickers, start=1):
            try:
                hcnb_stock_data.get_stock_data(ticker, True)
                payload = {
                    "status": "progress",
                    "current": index,
                    "total": total,
                    "ticker": ticker,
                    "percent": round((index / total) * 100, 2) if total else 100.0,
                }
            except Exception as exc:
                payload = {
                    "status": "error",
                    "current": index,
                    "total": total,
                    "ticker": ticker,
                    "error": str(exc),
                    "percent": round((index / total) * 100, 2) if total else 100.0,
                }

            yield f"data: {json.dumps(payload)}\n\n"

        yield f"data: {json.dumps({'status': 'complete', 'message': 'Update complete'})}\n\n"

    return Response(
        event_stream(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
        },
    )



@screener_bp.route('/fetch_stock_data', methods=['GET'])
def fetch_stock_data():
    ticker_input = request.args.get('ticker', '').strip()

    if not ticker_input:
        return jsonify({"Message": "No ticker provided"}), 400

    existing_tickers = hcnb_stock_data.get_all_tickers()

    if ticker_input.upper() not in [ticker.upper() for ticker in existing_tickers]:
        return jsonify({"Message": "Invalid ticker"}), 400

    stock_data = hcnb_stock_data.get_stock_data(ticker_input, False)
    return jsonify(stock_data.__dict__), 200
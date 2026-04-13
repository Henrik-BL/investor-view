import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from backend.routes.screener import screener_bp
from backend.routes.portfolio import portfolio_bp
from backend.routes.dividend_portfolio import dividend_portfolio_bp

# when building frontend, adjust this path if needed ("build" for CRA)
static_folder = os.path.join(os.path.dirname(__file__), "..", "frontend", "build")

app = Flask(__name__, static_folder=static_folder, static_url_path="")

CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

app.register_blueprint(screener_bp)
app.register_blueprint(portfolio_bp)
app.register_blueprint(dividend_portfolio_bp)

@app.route("/api/health")
def health_check():
    return jsonify(status="ok"), 200

# serve React app in production
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    # development server
    app.run(host="0.0.0.0", port=5000, debug=True)

import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from backend.routes.screener import screener_bp
from backend.routes.portfolio import portfolio_bp
from backend.routes.dividend_portfolio import dividend_portfolio_bp

cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:30080,http://investor-view-frontend:80,http://investor-view-frontend").split(",")
serve_frontend = os.environ.get("SERVE_FRONTEND", "false").lower() in ["1", "true", "yes"]
static_folder = None
if serve_frontend:
    # when building frontend, adjust this path if needed
    static_folder = os.path.join(os.path.dirname(__file__), "..", "frontend", "build")

app = Flask(__name__, static_folder=static_folder, static_url_path="")

CORS(app, resources={r"/api/*": {"origins": cors_origins}})

app.register_blueprint(screener_bp)
app.register_blueprint(portfolio_bp)
app.register_blueprint(dividend_portfolio_bp)

if serve_frontend:
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve(path):
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        else:
            return send_from_directory(app.static_folder, "index.html")

@app.route("/api/health")
def health_check():
    return jsonify(status="ok"), 200

if __name__ == "__main__":
    # development server
    app.run(host="0.0.0.0", port=5000, debug=True)

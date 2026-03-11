import os
from flask import Flask, jsonify, send_from_directory

# when building frontend, adjust this path if needed ("build" for CRA)
static_folder = os.path.join(os.path.dirname(__file__), "..", "frontend", "build")

app = Flask(__name__, static_folder=static_folder, static_url_path="")

@app.route("/api/hello")
def hello():
    return jsonify(message="Hello from Flask")

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

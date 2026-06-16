from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Data awal
latest_data = {"temp": 0.0, "humidity": 0.0, "heatindex": 0.0, "dewpoint": 0.0, "status": "MENUNGGU"}

# Endpoint Baru: Untuk menerima data dari komputer lokal kamu
@app.route("/api/update", methods=["POST"])
def update_data():
    global latest_data
    try:
        data = request.json
        # Validasi data yang masuk
        if data:
            latest_data = {
                "temp": float(data.get("temp", 0.0)),
                "humidity": float(data.get("humidity", 0.0)),
                "heatindex": float(data.get("heatindex", 0.0)),
                "dewpoint": float(data.get("dewpoint", 0.0)),
                "status": data.get("status", "OK")
            }
            return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    return jsonify({"status": "failed", "message": "No data received"}), 400

# Endpoint Lama: Untuk dibaca oleh Frontend/Aplikasi lain
@app.route("/api/latest")
def latest():
    return jsonify(latest_data)

if __name__ == "__main__":
    # PENTING: Menggunakan PORT dari Railway dan HOST 0.0.0.0
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

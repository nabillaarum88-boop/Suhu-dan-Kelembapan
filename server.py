from flask import Flask, jsonify
from flask_cors import CORS
import serial, threading

app = Flask(__name__)
CORS(app)

latest_data = {"temp": 0.0, "humidity": 0.0, "heatindex": 0.0, "dewpoint": 0.0, "status": "MENUNGGU"}

def read_arduino():
    global latest_data
    try:
        ser = serial.Serial("COM14", 9600, timeout=1)
        while True:
            line = ser.readline().decode("utf-8").strip()
            if not line: continue
            
            parts = line.split(",")
            if len(parts) == 6:
                try:
                    latest_data = {
                        "temp": float(parts[1]),
                        "humidity": float(parts[2]),
                        "heatindex": float(parts[3]),
                        "dewpoint": float(parts[4]),
                        "status": parts[5]
                  Exception as e:
        print(f"Error Serial: {e}")

threading.Thread(target=read_arduino, daemon=True).start()

@app.route("/api/latest")
def latest():
    return jsonify(latest_data)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
# do pip install pynmea2 serial

import serial
import pynmea2

GPS_PORT = "/dev/serial0"
gps = serial.Serial(GPS_PORT, baudrate=9600, timeout=1)

def read_gps():
    while True:
        line = gps.readline().decode('utf-8', errors='ignore')
        if line.startswith("$GPRMC"):  # Get valid GPS data
            msg = pynmea2.parse(line)
            if msg.status == 'A':  # 'A' means valid data
                latitude = msg.latitude
                longitude = msg.longitude
                speed_kmh = float(msg.spd_over_grnd) * 1.852  # Convert knots to km/h
                
                # Save GPS Data
                with open(f"{VIDEO_DIR}/gps_log.txt", "a") as f:
                    f.write(f"{msg.timestamp}, {latitude}, {longitude}, {speed_kmh} km/h\n")

read_gps()

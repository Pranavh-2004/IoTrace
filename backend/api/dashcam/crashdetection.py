# do pip insatll smbus2
import smbus
import math
import os
from record import VIDEO_DIR  # Missing import

# MPU6050 Registers
MPU_ADDR = 0x68
bus = smbus.SMBus(1)
bus.write_byte_data(MPU_ADDR, 0x6B, 0)

# Read acceleration
def read_acceleration():
    ax = bus.read_byte_data(MPU_ADDR, 0x3B) << 8 | bus.read_byte_data(MPU_ADDR, 0x3C)
    ay = bus.read_byte_data(MPU_ADDR, 0x3D) << 8 | bus.read_byte_data(MPU_ADDR, 0x3E)
    az = bus.read_byte_data(MPU_ADDR, 0x3F) << 8 | bus.read_byte_data(MPU_ADDR, 0x40)
    return ax / 16384.0, ay / 16384.0, az / 16384.0

# Detect crash (threshold: 2G impact)
def detect_crash():
    while True:
        ax, ay, az = read_acceleration()
        total_accel = math.sqrt(ax**2 + ay**2 + az**2)
        if total_accel > 2.0:  # Crash threshold
            print("⚠️ Crash detected! Saving footage...")
            save_crash_video()

# Save last recorded video as crash footage
def save_crash_video():
    latest_video = sorted(os.listdir(VIDEO_DIR))[-1]
    os.rename(f"{VIDEO_DIR}/{latest_video}", f"{VIDEO_DIR}/CRASH_{latest_video}")
import os
from record import save_crash_video

def detect_anomaly(g_force, speed):
    if g_force > 2.5 and speed > 20:  # Collision detected at high speed
        print("⚠️ CRASH DETECTED! Saving footage...")
        save_crash_video()
        send_alert()  # Optional: Upload footage to cloud or send SMS alert

def send_alert():
    # Implement alert functionality (SMS, email, etc.)
    print("Alert sent to emergency contacts")
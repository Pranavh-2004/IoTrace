if g_force > 2.5 and speed > 20:  # Collision detected at high speed
    print("⚠️ CRASH DETECTED! Saving footage...")
    save_current_footage()  # Store the last few minutes of footage
    send_alert()  # Optional: Upload footage to cloud or send SMS alert

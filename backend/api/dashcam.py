import os
import time
import threading
import hashlib
import json
from datetime import datetime

# Import all dashcam components
from dashcam.record import record_video, VIDEO_DIR, manage_storage
from dashcam.crashdetection import detect_crash, save_crash_video
from dashcam.gps_and_speed import read_gps
from dashcam.storagemgmt import check_storage
from dashcam.gdrive import upload_to_drive

# Ensure video directory exists
os.makedirs(VIDEO_DIR, exist_ok=True)

# File to store video hashes
HASH_FILE = os.path.join(VIDEO_DIR, "video_hashes.json")

def calculate_file_hash(filepath):
    """Calculate SHA-256 hash of a file"""
    hash_sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_sha256.update(chunk)
    return hash_sha256.hexdigest()

def save_file_hash(filename, file_hash):
    """Save file hash to the hash log"""
    hashes = {}
    if os.path.exists(HASH_FILE):
        try:
            with open(HASH_FILE, "r") as f:
                hashes = json.load(f)
        except json.JSONDecodeError:
            pass  # Start with empty dict if file is corrupted
    
    hashes[filename] = {
        "hash": file_hash,
        "timestamp": datetime.now().isoformat()
    }
    
    with open(HASH_FILE, "w") as f:
        json.dump(hashes, f, indent=2)

def verify_file_integrity(filename):
    """Verify if a file has been tampered with"""
    if not os.path.exists(HASH_FILE):
        return False, "No hash records found"
    
    filepath = os.path.join(VIDEO_DIR, filename)
    if not os.path.exists(filepath):
        return False, "File not found"
    
    with open(HASH_FILE, "r") as f:
        hashes = json.load(f)
    
    if filename not in hashes:
        return False, "No hash record for this file"
    
    stored_hash = hashes[filename]["hash"]
    current_hash = calculate_file_hash(filepath)
    
    if stored_hash == current_hash:
        return True, "File integrity verified"
    else:
        return False, "File has been modified"

def record_with_hash():
    """Modified recording function that also calculates and saves hashes"""
    while True:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}.mp4"
        filepath = os.path.join(VIDEO_DIR, filename)
        
        # Record for 60 seconds (H.264 encoding, 1280x720 resolution)
        os.system(f"ffmpeg -f v4l2 -i /dev/video0 -t 60 -vf 'scale=1280:720' -c:v libx264 {filepath}")
        
        # Calculate and save hash
        file_hash = calculate_file_hash(filepath)
        save_file_hash(filename, file_hash)
        
        # Check storage space
        manage_storage()
        check_storage()

def start_dashcam():
    """Start all dashcam components in separate threads"""
    threads = []
    
    # Start recording with hash verification
    record_thread = threading.Thread(target=record_with_hash, daemon=True)
    threads.append(record_thread)
    
    # Start crash detection
    crash_thread = threading.Thread(target=detect_crash, daemon=True)
    threads.append(crash_thread)
    
    # Start GPS logging
    gps_thread = threading.Thread(target=read_gps, daemon=True)
    threads.append(gps_thread)
    
    # Start periodic upload to Google Drive
    def periodic_upload():
        while True:
            upload_to_drive()
            time.sleep(3600)  # Upload every hour
    
    upload_thread = threading.Thread(target=periodic_upload, daemon=True)
    threads.append(upload_thread)
    
    # Start all threads
    for thread in threads:
        thread.start()
    
    try:
        # Keep main thread alive
        while True:
            time.sleep(10)
    except KeyboardInterrupt:
        print("Dashcam system shutting down...")

if __name__ == "__main__":
    print("Starting dashcam system...")
    start_dashcam()
import os
import time
from datetime import datetime

# Folder to store recordings
VIDEO_DIR = "/home/pi/dashcam_videos"
os.makedirs(VIDEO_DIR, exist_ok=True)

# Loop recording function
def record_video():
    while True:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{VIDEO_DIR}/{timestamp}.mp4"
        
        # Record for 60 seconds (H.264 encoding, 1280x720 resolution)
        os.system(f"ffmpeg -f v4l2 -i /dev/video0 -t 60 -vf 'scale=1280:720' -c:v libx264 {filename}")
        
        # Keep only the latest 10 videos
        manage_storage()

# Delete old recordings if more than 10 exist
def manage_storage():
    files = sorted(os.listdir(VIDEO_DIR))
    while len(files) > 10:
        os.remove(os.path.join(VIDEO_DIR, files.pop(0)))

record_video()

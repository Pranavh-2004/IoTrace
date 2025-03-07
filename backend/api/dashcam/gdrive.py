# do pip install gdrivefs
import os
import subprocess

def upload_to_drive():
    files = [f for f in os.listdir(VIDEO_DIR) if f.startswith("CRASH_")]
    for file in files:
        subprocess.run(["gdrive", "upload", f"{VIDEO_DIR}/{file}"])

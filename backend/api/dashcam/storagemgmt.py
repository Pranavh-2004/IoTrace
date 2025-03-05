import shutil

def check_storage():
    total, used, free = shutil.disk_usage("/")
    if free / total < 0.1:  # If free space < 10%
        delete_old_videos()

def delete_old_videos():
    files = sorted([f for f in os.listdir(VIDEO_DIR) if not f.startswith("CRASH_")])
    while len(files) > 5:  # Keep 5 normal videos
        os.remove(os.path.join(VIDEO_DIR, files.pop(0)))

check_storage()

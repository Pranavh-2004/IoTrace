import os
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from supabase import create_client
import uuid
import re
import csv
import hashlib

def convert(input_log_file, output_csv_file):
    # Regular expression to parse Logcat logs
    log_pattern = re.compile(
        r"(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})\s+"
        r"(?P<process_id>\d+)-(?P<thread_id>\d+)\s+"
        r"(?P<component>[\w\.\-\s]+)\s+"
        r"(?P<package>[\w\.\-\s]+)\s+"
        r"(?P<log_level>[DIEWVF])\s+"
        r"(?P<message>.+)"
    )

    # Open the log file and parse each line
    structured_logs = []

    with open(input_log_file, "r", encoding="utf-8") as log_file:
        for line in log_file:
            match = log_pattern.match(line)
            if match:
                structured_logs.append(match.groupdict())

    # Save structured logs to CSV
    with open(output_csv_file, "w", newline="", encoding="utf-8") as csv_file:
        fieldnames = ["timestamp", "process_id", "thread_id", "component", "package", "log_level", "message"]
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(structured_logs)

    print(f"Structured logs saved to {output_csv_file}")

# Supabase Configuration
SUPABASE_URL = "--INSERT-SUPABASE-URL--"
SUPABASE_KEY = "--INSERT-SUPABASE-KEY--"
BUCKET_NAME = "logs"
SUPABASE_SERVICE_KEY = "--INSERT-SERVICE-KEY--"
WAIT_TIME = 12  # Seconds to wait before checking file again
USER_ID ="--INSERT-USER-ID--"

def get_sha256(file_path):
    sha256 = hashlib.sha256()
    with open(file_path, 'rb') as file:
        # Read the file in 4KB chunks to handle large files efficiently
        for chunk in iter(lambda: file.read(4096), b''):
            sha256.update(chunk)
    return sha256.hexdigest()

# Initialize Supabase client with service role if available
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

class UploadHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory:
            file_path = event.src_path
            print(f"New file detected: {file_path}")
            
            # Check if file exists and is not empty
            if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                print(f"File has content. Waiting {WAIT_TIME} seconds before final check...")
                self.wait_and_check(file_path)
            else:
                print(f"Initial check: {file_path} is empty or no longer exists. Waiting {WAIT_TIME} seconds before rechecking...")
                self.wait_and_check(file_path)

    def wait_and_check(self, file_path):
        # Wait for specified time
        time.sleep(WAIT_TIME)
        
        # Check again after waiting
        if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
            print(f"Final check passed: {file_path} exists and has content. Uploading...")
            self.upload_to_supabase(file_path)
        else:
            print(f"Final check failed: {file_path} is empty or no longer exists. Skipping upload.")

    def upload_to_supabase(self, file_path):
        try:
            original_file_name = os.path.basename(file_path)
            file_name = USER_ID
            
            if not os.path.exists(file_path):
                print(f"File disappeared: {file_path}")
                return
            
            # Generate a unique path for storage
            unique_path = f"{file_name}"
            convert(file_path, f"{file_name}.csv")
            file_path = f"{file_name}.csv"
            
            with open(file_path, 'rb') as f:
                file_content = f.read()
                
                # Double-check file is not empty
                if not file_content:
                    print(f"Skipping {file_path}: File is empty")
                    return
                
                # STEP 1: First, upload the file to storage
                try:
                    print("Uploading file to Supabase storage...")
                    res = supabase.storage.from_(BUCKET_NAME).upload(
                        path=file_path,
                        file=file_content,
                        file_options={"content-type": "application/octet-stream", "x-upsert": "true"}
                    )
                    print(f"Successfully uploaded {file_name} to {unique_path}!")
                    
                    # STEP 2: Calculate hash after file is uploaded
                    file_hash = get_sha256(file_path)
                    print(f"File hash calculated: {file_hash}")
                    
                    # STEP 3: Update the existing row with the hash in the hash field
                    # First check if a row exists for this user
                    query_result = supabase.table('cases').select('*').eq('user_id', USER_ID).execute()
                    
                    if query_result.data and len(query_result.data) > 0:
                        # Row exists, update it
                        update_result = supabase.table('cases').update({
                            "hash": file_hash  # Changed from "uuid" to "hash"
                        }).eq('user_id', USER_ID).execute()
                        print(f"Updated existing row with hash: {update_result}")
                    
                    # Move file to processed directory
                    processed_dir = os.path.join(os.path.dirname(file_path), "processed")
                    os.makedirs(processed_dir, exist_ok=True)
                    processed_path = os.path.join(processed_dir, os.path.basename(file_path))
                    os.rename(file_path, processed_path)
                    print(f"Moved file to {processed_path}")
                
                except Exception as upload_error:
                    print(f"Error during upload or database update: {str(upload_error)}")
            
        except Exception as e:
            print(f"Error processing {file_path}: {str(e)}")


if __name__ == "__main__":
    folder_to_watch = "/home/grass/supabase_stuff"
    
    if not os.path.exists(folder_to_watch):
        raise FileNotFoundError(f"Folder not found: {folder_to_watch}")
    
    print(f"Monitoring folder: {folder_to_watch}")
    
    event_handler = UploadHandler()
    observer = Observer()
    observer.schedule(event_handler, folder_to_watch, recursive=False)
    
    try:
        observer.start()
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    finally:
        observer.join()


import re
import csv

# Define log file paths
input_log_file = "/Users/pranavhemanth/Code/Hackathons & Workshops/IoTrace/backend/api/smartwatch/logcat_watch5.txt"
output_csv_file = "/Users/pranavhemanth/Code/Hackathons & Workshops/IoTrace/backend/api/smartwatch/logcat_output.csv"

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
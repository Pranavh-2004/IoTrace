#!/bin/bash

LOG_FILE="$1"
CSV_FILE="${2:-.output.csv}" #give output file path

# Validate input
if [ -z "$LOG_FILE" ]; then
    echo "Usage: $0 <log_file> [csv_file]"
    exit 1
fi

if [ ! -f "$LOG_FILE" ]; then
    echo "Error: Log file $LOG_FILE does not exist."
    exit 1
fi

# Create CSV header if file doesn't exist
if [ ! -f "$CSV_FILE" ]; then
    echo "Timestamp,Process ID,Thread ID,Log Level,Component,Message" > "$CSV_FILE"
    echo "Created new CSV file: $CSV_FILE"
fi

# Function to parse a single log line and append to CSV
parse_log_line() {
    local line="$1"
    
    # Extract components using regex
    if [[ $line =~ ([0-9]{2}-[0-9]{2}\ [0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3})\ +([0-9]+)\ +([0-9]+)\ ([A-Z])\ ([^:]+)\ *:\ *(.*) ]]; then
        local timestamp="${BASH_REMATCH[1]}"
        local pid="${BASH_REMATCH[2]}"
        local tid="${BASH_REMATCH[3]}"
        local level="${BASH_REMATCH[4]}"
        local component="${BASH_REMATCH[5]}"
        local message="${BASH_REMATCH[6]}"
        
        # Escape any commas and quotes in fields
        message=$(echo "$message" | sed 's/"/\\"/g')
        component=$(echo "$component" | sed 's/"/\\"/g')
        
        # Append to CSV
        echo "\"$timestamp\",$pid,$tid,\"$level\",\"$component\",\"$message\"" >> "$CSV_FILE"
    fi
}

# Process the entire log file
echo "Parsing $LOG_FILE..."
while IFS= read -r line; do
    parse_log_line "$line"
done < "$LOG_FILE"

echo "Parsing completed. Output saved to $CSV_FILE"

#!/bin/bash

# Export ChartDB metadata from PostgreSQL database

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Output file
OUTPUT_FILE="$SCRIPT_DIR/chartdb_metadata.json"

echo "Exporting database metadata for ChartDB..."

# Read the SQL query
SQL_QUERY=$(cat "$SCRIPT_DIR/export_chartdb_metadata.sql")

# Run the SQL query directly on the container
docker exec atria-db-dev psql -U user -d atria -t -A -c "$SQL_QUERY" > "$OUTPUT_FILE"

# Check if the export was successful
if [ $? -eq 0 ]; then
    # Check if the file has content
    if [ -s "$OUTPUT_FILE" ]; then
        echo "✅ Successfully exported metadata to: $OUTPUT_FILE"
        echo ""
        # Show file size
        FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
        echo "📊 File size: $FILE_SIZE"
        echo ""
        echo "Next steps:"
        echo "1. Go to https://chartdb.io/"
        echo "2. Click 'Import' or 'Import from JSON'"
        echo "3. Upload the file: $OUTPUT_FILE"
        echo "4. ChartDB will generate an interactive visual diagram of your database"
    else
        echo "❌ Export completed but file is empty. Database might not have any tables."
        exit 1
    fi
else
    echo "❌ Failed to export metadata"
    echo "Make sure:"
    echo "- Docker containers are running (docker compose up)"
    echo "- Database is accessible"
    echo "- You're in the project root directory"
    exit 1
fi
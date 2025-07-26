#!/bin/bash
# populate_users.sh
# Bash script to populate the database with 10 random users using psql



 

# Use POSTGRES_CONNECTION_STRING from .env
psql "$POSTGRES_CONNECTION_STRING" -f "$(dirname "$0")/populate_users.sql"

echo "Inserted 10 random users into the database."

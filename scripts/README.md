# Atria Scripts

This directory contains utility scripts for managing the Atria application.

## manage-db.sh

Database management utility for development and production environments.

### Usage

```bash
# Development environment (default)
./scripts/manage-db.sh [command]

# Production environment
ENV=production ./scripts/manage-db.sh [command]
```

### Commands

- **status** - Check database status, migration version, and data counts
- **reset** - Reset database (removes all data) - asks for confirmation
- **fresh** - Reset database and start with seeded data
- **migrate** - Run pending database migrations
- **help** - Show usage information

### Examples

```bash
# Check database status
./scripts/manage-db.sh status

# Start fresh with seeded data (development)
./scripts/manage-db.sh fresh

# Reset production database (careful!)
ENV=production ./scripts/manage-db.sh reset

# Run migrations
./scripts/manage-db.sh migrate
```

### Notes

- The script automatically detects which docker-compose file to use based on ENV
- Fresh start sets `SEED_DB=true` temporarily for that run
- Always backs up production data before using reset commands
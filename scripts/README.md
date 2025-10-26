# Atria Scripts

This directory contains utility scripts for managing the Atria application.

## Directory Structure

- **`dev/`** - Development environment management (tmux-based)
- **`testing/`** - Testing and validation scripts
- **`database/`** - Database utilities and management

---

## dev/

Development environment scripts that launch tmux sessions with Docker Compose configurations.

**⚡ Quick Start:** Use the interactive menu in the project root:
```bash
./dev-environment-chooser.sh
```

### Available Environments

Each environment has a `start-*-tmux.sh` and corresponding `stop-*-tmux.sh` script:

- **local-dev** - Standard local development (single backend, no Redis)
- **redis-dev** - Redis + Traefik development (clustered backends, production-like)
- **preview** - Production preview with nginx (tests production builds)
- **tailscale-dev** - Remote access development (for mobile/phone testing)

### Usage

```bash
# Start an environment
./scripts/dev/start-redis-dev-tmux.sh

# Stop an environment
./scripts/dev/stop-redis-dev-tmux.sh
```

### What They Do

- Create a tmux session with multiple windows
- Start Docker Compose services
- Set up log viewing panes
- Provide shell access windows

To view a running session: `tmux attach -t atria-[environment-name]`
To detach: `Ctrl-b` then `d`

---

## testing/

Scripts for testing and validating various components of the application.

### Scripts

- **`test-nginx-frontend.sh`** - Tests nginx frontend serving and configuration
- **`test-redis-integration.sh`** - Tests Redis clustering and Socket.IO integration
- **`test-socketio-redis.py`** - Python-based Socket.IO + Redis testing
- **`test_email_invitation.py`** - Tests email invitation functionality

These scripts are primarily used for development validation and integration testing.

---

## database/

### manage-db.sh

Database management utility for development and production environments.

#### Usage

```bash
# Development environment (default)
./scripts/database/manage-db.sh [command]

# Production environment
ENV=production ./scripts/database/manage-db.sh [command]
```

#### Commands

- **status** - Check database status, migration version, and data counts
- **reset** - Reset database (removes all data) - asks for confirmation
- **fresh** - Reset database and start with seeded data
- **migrate** - Run pending database migrations
- **help** - Show usage information

#### Examples

```bash
# Check database status
./scripts/database/manage-db.sh status

# Start fresh with seeded data (development)
./scripts/database/manage-db.sh fresh

# Reset production database (careful!)
ENV=production ./scripts/database/manage-db.sh reset

# Run migrations
./scripts/database/manage-db.sh migrate
```

#### Notes

- Automatically detects which docker-compose file to use based on ENV
- Fresh start sets `SEED_DB=true` temporarily for that run
- Always backs up production data before using reset commands

### schema-query.sql

PostgreSQL query that extracts complete database schema as JSON, including:
- Foreign key relationships
- Primary keys
- Column definitions
- Indexes
- Tables and views
- Database configuration

Useful for generating database diagrams or documentation.

#### Usage

```bash
# Run against your database
docker compose exec db psql -U <user> -d <database> -f scripts/database/schema-query.sql
```

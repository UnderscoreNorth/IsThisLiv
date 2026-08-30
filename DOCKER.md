# IsThisLiv Docker Setup

This project is fully Dockerized for easy development and deployment.

## Quick Start

1. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your settings** (optional - defaults work fine for development)

3. **Start everything:**
   ```bash
   docker-compose up -d
   ```

4. **Access your applications:**
   - Frontend (Svelte): http://localhost:5173
   - Backend (Express): http://localhost:3000
   - MySQL Database: localhost:3306

## How It Works

### Environment Variables → Express Config

The Docker setup **automatically injects** database credentials into your Express app via environment variables. You don't need to manually edit `config.json`!

**How it works:**
1. Docker Compose reads variables from `.env`
2. Passes them as environment variables to the Express container
3. Express reads from environment variables (via [src/config.ts](express/src/config.ts))
4. Falls back to `config.json` if running outside Docker

### Configuration Priority

```
Environment Variables (Docker) > config.json (Local Development)
```

## Development Workflow

### Hot Reload Enabled ✨

Both Express and Svelte support hot-reload:
- **Svelte**: Changes to files in `svelte/src/` reload instantly
- **Express**: Changes to files in `express/src/` restart the server automatically

### Useful Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f express
docker-compose logs -f svelte
docker-compose logs -f mysql

# Restart a specific service
docker-compose restart express

# Stop all services
docker-compose down

# Stop and remove volumes (deletes database data!)
docker-compose down -v

# Rebuild after changing dependencies
docker-compose build
docker-compose up -d
```

## Services

### MySQL (Port 3306)
- **Image:** mysql:8.0
- **Data:** Persisted in Docker volume `mysql_data`
- **Credentials:** Set via `.env` file

### Express Backend (Port 3000)
- **Node:** 20-alpine
- **Dev Mode:** `npm run dev` with tsx watch
- **Config:** Injected via environment variables

### Svelte Frontend (Port 5173)
- **Node:** 20-alpine
- **Dev Mode:** `npm run dev` with Vite
- **HMR:** Full hot module replacement

## Environment Variables

All variables in `.env` with defaults:

```env
# Database
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=isthisliv
MYSQL_USER=isthisliv_user
MYSQL_PASSWORD=password
MYSQL_PORT=3306

# Ports
EXPRESS_PORT=3000
SVELTE_PORT=5173

# Security
SALT=your_secret_salt_here_change_this_in_production
```

## Troubleshooting

### Express can't connect to MySQL
- Wait 10-20 seconds for MySQL to fully start on first run
- Check logs: `docker-compose logs mysql`

### Port already in use
- Change ports in `.env` file:
  ```env
  EXPRESS_PORT=3001
  SVELTE_PORT=5174
  MYSQL_PORT=3307
  ```

### Changes not reflecting
- Make sure files are mounted correctly
- Check `docker-compose.yml` volumes section
- Try: `docker-compose restart express`

### Need to access MySQL directly
```bash
docker exec -it isthisliv-mysql mysql -u isthisliv_user -p
# Enter password from .env file
```

## Production Deployment

For production:
1. Change all passwords in `.env`
2. Update `SALT` to a strong random value
3. Consider creating separate Dockerfiles for production builds
4. Use environment-specific docker-compose files

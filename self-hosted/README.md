# OlasPlay Self-Hosted Deployment Guide

Complete guide to deploy OlasPlay on your VPS with CloudPanel.

## Prerequisites

- VPS with Ubuntu 22.04+
- CloudPanel installed
- Docker and Docker Compose installed
- Domain pointed to your VPS IP

## Quick Start

### 1. Clone and Setup

```bash
# Upload the self-hosted folder to your VPS
scp -r self-hosted/ user@your-vps:/home/user/olasplay/

# SSH into your VPS
ssh user@your-vps

# Navigate to the project
cd /home/user/olasplay/self-hosted
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit with your values
nano .env
```

Generate required secrets:

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate passwords
openssl rand -hex 16
```

### 3. Generate Supabase Keys

Use the Supabase key generator or create manually:

```bash
# Install Supabase CLI
npm install -g supabase

# Or use online generator:
# https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys
```

### 4. Build Frontend

On your local machine or CI/CD:

```bash
# Clone your frontend repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Install dependencies
npm install

# Create production .env
echo "VITE_SUPABASE_URL=https://api.olasplay.com" >> .env
echo "VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY" >> .env

# Build
npm run build

# Upload dist folder
scp -r dist/ user@your-vps:/home/user/olasplay/self-hosted/frontend/
```

### 5. Copy Edge Functions

```bash
# From your local project
scp -r supabase/functions/ user@your-vps:/home/user/olasplay/self-hosted/functions/
```

### 6. SSL Certificates

Using Let's Encrypt with Certbot:

```bash
# Install certbot
apt install certbot

# Get certificates
certbot certonly --standalone -d olasplay.com -d www.olasplay.com

# Copy to nginx ssl folder
cp /etc/letsencrypt/live/olasplay.com/fullchain.pem ./nginx/ssl/
cp /etc/letsencrypt/live/olasplay.com/privkey.pem ./nginx/ssl/
```

### 7. Start Services

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 8. Initialize Database

```bash
# The SQL files in database/ folder are auto-executed on first start
# To manually run additional migrations:
docker exec -i olasplay-db psql -U postgres -d postgres < ./database/02-seed-data.sql
```

## CloudPanel Integration

If using CloudPanel's Nginx:

1. Create a Static HTML site in CloudPanel for `olasplay.com`
2. Point document root to `/home/user/olasplay/self-hosted/frontend/dist`
3. Add the API proxy rules to CloudPanel's Nginx vhost config

## Directory Structure

```
self-hosted/
├── database/
│   ├── 01-schema.sql      # Database schema
│   └── 02-seed-data.sql   # Seed data
├── functions/              # Edge functions (copy from supabase/functions/)
├── frontend/
│   └── dist/              # Built frontend files
├── kong/
│   └── kong.yml           # API Gateway config
├── nginx/
│   ├── nginx.conf         # Nginx configuration
│   └── ssl/               # SSL certificates
├── docker-compose.yml     # Docker services
├── .env.example           # Environment template
└── README.md              # This file
```

## Maintenance

### Backup Database

```bash
docker exec olasplay-db pg_dump -U postgres postgres > backup_$(date +%Y%m%d).sql
```

### Update Services

```bash
docker-compose pull
docker-compose up -d
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f db
docker-compose logs -f auth
docker-compose logs -f functions
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if database is healthy
docker exec olasplay-db pg_isready -U postgres

# View database logs
docker-compose logs db
```

### Auth Not Working

1. Verify JWT_SECRET matches in all services
2. Check SITE_URL is correctly set
3. Verify SMTP settings for email

### Edge Functions Not Running

```bash
# Check functions container
docker-compose logs functions

# Verify function files are mounted
docker exec olasplay-functions ls /home/deno/functions
```

## Security Recommendations

1. Change all default passwords in `.env`
2. Use strong JWT secret (32+ characters)
3. Enable firewall, only expose ports 80/443
4. Regular security updates
5. Setup automated backups
6. Monitor logs for suspicious activity

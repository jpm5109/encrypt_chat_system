# VaultChat Deployment Guide

Complete step-by-step instructions for deploying VaultChat to production environments.

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Python CLI Version Deployment](#python-cli-version-deployment)
3. [Web Version Deployment](#web-version-deployment)
4. [Cloud Platforms](#cloud-platforms)
5. [Docker Deployment](#docker-deployment)
6. [Post-Deployment](#post-deployment)

---

## ✅ Pre-Deployment Checklist

### General Requirements
- [ ] Code tested locally
- [ ] All dependencies documented
- [ ] Environment variables configured
- [ ] Security review completed (see [SECURITY.md](./SECURITY.md))
- [ ] `.env` file excluded from git
- [ ] Encryption keys generated and secured
- [ ] README documentation updated
- [ ] Version bumped (if using versioning)

### Python Version
- [ ] `SHARED_KEY` changed from default
- [ ] Host/Port configured for target environment
- [ ] Dependencies installed and tested
- [ ] Python 3.8+ available on server

### Web Version
- [ ] Firebase project created and configured
- [ ] `.env` file with Firebase credentials
- [ ] Build tested (`npm run build`)
- [ ] Node 16+ available
- [ ] Domain/hosting provider ready

---

## 🐍 Python CLI Version Deployment

### Option 1: Linux Server (Recommended)

#### Step 1: Prepare Server
```bash
# SSH into server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.8+
sudo apt install -y python3.8 python3.8-venv python3.8-dev

# Create application directory
sudo mkdir -p /opt/vaultchat
sudo chown $USER:$USER /opt/vaultchat
```

#### Step 2: Clone Repository
```bash
cd /opt/vaultchat
git clone https://github.com/jpm5109/vaultchat.git .
cd python-version
```

#### Step 3: Setup Virtual Environment
```bash
python3.8 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

#### Step 4: Configure Environment
```bash
# Create .env file for production keys
cat > ../.env << EOF
SHARED_KEY=your_generated_encryption_key_here
HOST=0.0.0.0  # Listen on all interfaces
PORT=55555
EOF

# Make it read-only
chmod 400 ../.env
```

#### Step 5: Create Systemd Service

**Create `/etc/systemd/system/vaultchat-server.service`:**
```ini
[Unit]
Description=VaultChat Server
After=network.target

[Service]
Type=simple
User=vaultchat
WorkingDirectory=/opt/vaultchat/python-version
Environment="PATH=/opt/vaultchat/python-version/venv/bin"
ExecStart=/opt/vaultchat/python-version/venv/bin/python server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable and start service:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable vaultchat-server
sudo systemctl start vaultchat-server

# Check status
sudo systemctl status vaultchat-server
sudo journalctl -u vaultchat-server -f  # View logs
```

#### Step 6: Configure Firewall
```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow VaultChat port
sudo ufw allow 55555/tcp

# Enable firewall
sudo ufw enable
```

### Option 2: Docker Container

#### Create Dockerfile
```dockerfile
FROM python:3.8-slim

WORKDIR /app

COPY python-version/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY python-version/server.py .

EXPOSE 55555

CMD ["python", "server.py"]
```

#### Build and Run
```bash
# Build image
docker build -t vaultchat-server:1.0 .

# Run container
docker run -d \
  --name vaultchat-server \
  -p 55555:55555 \
  -e SHARED_KEY="your_key_here" \
  -e HOST="0.0.0.0" \
  vaultchat-server:1.0

# View logs
docker logs -f vaultchat-server
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  vaultchat-server:
    build: ./python-version
    container_name: vaultchat-server
    ports:
      - "55555:55555"
    environment:
      SHARED_KEY: ${SHARED_KEY}
      HOST: 0.0.0.0
      PORT: 55555
    restart: always
    volumes:
      - ./logs:/app/logs
```

```bash
# Run with docker-compose
docker-compose up -d
docker-compose logs -f
```

### Client Deployment

For Python clients connecting to remote server:

```python
# Update client.py
HOST = 'your-server-ip-or-domain'  # Change from 127.0.0.1
PORT = 55555                        # Change if needed
SHARED_KEY = b'same_key_as_server'  # Must match server
```

---

## 🌐 Web Version Deployment

### Option 1: Vercel (Recommended - Easiest)

#### Step 1: Setup Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel (creates account if needed)
vercel login
```

#### Step 2: Configure Environment
```bash
cd web-version

# Add environment variables to vercel.json
cat > vercel.json << 'EOF'
{
  "env": {
    "VITE_FIREBASE_API_KEY": "@firebase_api_key",
    "VITE_FIREBASE_AUTH_DOMAIN": "@firebase_auth_domain",
    "VITE_FIREBASE_PROJECT_ID": "@firebase_project_id",
    "VITE_FIREBASE_STORAGE_BUCKET": "@firebase_storage_bucket",
    "VITE_FIREBASE_MESSAGING_SENDER_ID": "@firebase_messaging_sender_id",
    "VITE_FIREBASE_APP_ID": "@firebase_app_id",
    "VITE_FIREBASE_MEASUREMENT_ID": "@firebase_measurement_id"
  }
}
EOF
```

#### Step 3: Deploy
```bash
# Deploy to Vercel
vercel

# Follow the prompts to:
# 1. Link to Git repository
# 2. Configure environment variables
# 3. Deploy

# View deployment
vercel ls
```

#### Step 4: Add Environment Variables
```bash
# Set production environment variables
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
# ... continue for all Firebase variables

# Deploy with new variables
vercel --prod
```

### Option 2: Netlify

#### Step 1: Build Project
```bash
cd web-version
npm run build
```

#### Step 2: Deploy via Drag & Drop
- Visit [netlify.com](https://netlify.com)
- Drag & drop `dist/` folder
- Configure environment variables in Site Settings

#### Step 3: Enable Git Integration (Recommended)
```bash
# Push to GitHub, connect Netlify
# Netlify auto-deploys on push
```

#### Step 4: Configure Build
```bash
# Create netlify.toml
cat > netlify.toml << 'EOF'
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  VITE_FIREBASE_API_KEY = "your_key"
  # ... other variables
EOF
```

### Option 3: Self-Hosted (Linux/Ubuntu)

#### Step 1: Prepare Server
```bash
# SSH into server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx

# Create app directory
sudo mkdir -p /var/www/vaultchat
sudo chown $USER:$USER /var/www/vaultchat
```

#### Step 2: Deploy Application
```bash
cd /var/www/vaultchat
git clone https://github.com/jpm5109/vaultchat.git .

# Build the application
cd web-version
cp .env.example .env

# Edit .env with production Firebase credentials
nano .env

# Install and build
npm ci  # Clean install
npm run build
```

#### Step 3: Configure Nginx

**Create `/etc/nginx/sites-available/vaultchat`:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    root /var/www/vaultchat/web-version/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/vaultchat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 4: Setup SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

#### Step 5: Setup Auto-Deployment (Optional)
```bash
# Create deployment script
cat > /var/www/vaultchat/deploy.sh << 'EOF'
#!/bin/bash
cd /var/www/vaultchat
git pull origin main
cd web-version
npm ci
npm run build
sudo systemctl reload nginx
EOF

chmod +x /var/www/vaultchat/deploy.sh

# Setup GitHub webhook to run this script on push
```

### Option 4: AWS S3 + CloudFront

#### Step 1: Build Application
```bash
cd web-version
npm run build
```

#### Step 2: Create S3 Bucket
```bash
# Using AWS CLI
aws s3 mb s3://vaultchat-app-123456 --region us-east-1
```

#### Step 3: Upload Build
```bash
# Upload dist folder
aws s3 sync dist/ s3://vaultchat-app-123456/ --delete

# Make files public (if not using CloudFront auth)
aws s3api put-bucket-policy --bucket vaultchat-app-123456 --policy file://policy.json
```

#### Step 4: Setup CloudFront
```bash
# In AWS Console:
# 1. Create CloudFront distribution
# 2. Point origin to S3 bucket
# 3. Set default root object to index.html
# 4. Add custom domain
# 5. Enable caching
```

---

## 🐳 Docker Deployment (Full Stack)

### Docker Compose with Both Versions

```yaml
version: '3.8'

services:
  # Python CLI Server
  vaultchat-server:
    build:
      context: .
      dockerfile: python-version/Dockerfile
    container_name: vaultchat-server
    ports:
      - "55555:55555"
    environment:
      SHARED_KEY: ${SHARED_KEY}
      HOST: 0.0.0.0
      PORT: 55555
    restart: always
    healthcheck:
      test: ["CMD", "nc", "-z", "localhost", "55555"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - vaultchat-network

  # Web Application
  vaultchat-web:
    build:
      context: ./web-version
      dockerfile: Dockerfile
    container_name: vaultchat-web
    ports:
      - "3000:3000"
    environment:
      VITE_FIREBASE_API_KEY: ${VITE_FIREBASE_API_KEY}
      VITE_FIREBASE_AUTH_DOMAIN: ${VITE_FIREBASE_AUTH_DOMAIN}
      VITE_FIREBASE_PROJECT_ID: ${VITE_FIREBASE_PROJECT_ID}
      VITE_FIREBASE_STORAGE_BUCKET: ${VITE_FIREBASE_STORAGE_BUCKET}
      VITE_FIREBASE_MESSAGING_SENDER_ID: ${VITE_FIREBASE_MESSAGING_SENDER_ID}
      VITE_FIREBASE_APP_ID: ${VITE_FIREBASE_APP_ID}
      VITE_FIREBASE_MEASUREMENT_ID: ${VITE_FIREBASE_MEASUREMENT_ID}
    restart: always
    depends_on:
      - vaultchat-server
    networks:
      - vaultchat-network

networks:
  vaultchat-network:
    driver: bridge
```

**Deploy:**
```bash
# Create .env file with all variables
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Dockerfile for Web Version
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run production build
RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
```

---

## 🔄 Post-Deployment

### Monitoring

#### Application Health Checks
```bash
# Python Server
curl -v telnet://your-server:55555

# Web Application
curl -I https://your-domain.com

# Check logs
docker logs vaultchat-server
docker logs vaultchat-web
```

#### Setup Monitoring Tools
```bash
# Install monitoring (Optional)
# Datadog, New Relic, Sentry, etc.

# Application error tracking
npm install --save @sentry/react
```

### Logging

#### Python Server Logs
```bash
# View service logs
sudo journalctl -u vaultchat-server -f

# Save logs to file
sudo journalctl -u vaultchat-server > vaultchat.log
```

#### Web Application Logs
```bash
# Docker logs
docker logs -f vaultchat-web

# Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

### Backup Strategy

#### Database Backups (Firestore)
```bash
# Export Firestore
gcloud firestore export gs://vaultchat-backups/backup-$(date +%Y%m%d)

# Schedule daily backups (Cloud Scheduler)
# Or use third-party backup service
```

#### Code Backups
```bash
# GitHub handles backups automatically
# Ensure you have backup branches
git branch -a
```

### Updates & Maintenance

#### Update Dependencies
```bash
# Python
pip install --upgrade -r requirements.txt

# Node.js
npm update
npm audit fix
```

#### Deploy Updates
```bash
# Vercel auto-deploys on git push

# Self-hosted updates
cd /var/www/vaultchat
git pull origin main
npm run build
sudo systemctl reload nginx

# Docker updates
docker-compose pull
docker-compose up -d
```

### SSL Certificate Renewal

```bash
# Let's Encrypt (auto-renewal)
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew
```

---

## 🚨 Troubleshooting Deployment

### Python Server Won't Start
```bash
# Check port availability
lsof -i :55555

# Check Python installation
python3 --version

# Run directly to see errors
python server.py

# Check systemd status
sudo systemctl status vaultchat-server
sudo journalctl -u vaultchat-server -n 20
```

### Web App Blank Page
```bash
# Check Firebase credentials in .env
cat .env

# Check build output
npm run build

# Test locally
npm run dev

# Check browser console (F12) for errors
# Check Nginx error log
sudo tail -f /var/log/nginx/error.log
```

### Connection Refused
```bash
# Check firewall
sudo ufw status

# Check if service is running
sudo systemctl status vaultchat-server

# Check network binding
netstat -tlnp | grep 55555
```

### High Memory Usage
```bash
# Monitor resource usage
docker stats

# Limit container resources
docker update --memory 512m vaultchat-server
```

---

## 📊 Performance Optimization

### Web Version
```javascript
// Enable service worker for offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### Nginx Optimization
```nginx
# Increase worker connections
worker_connections 2048;

# Enable gzip compression (already in config)
gzip on;
gzip_comp_level 6;

# Cache control
expires 1y;
```

### Python Server Optimization
```python
# Increase TCP backlog
self.server.listen(128)

# Optimize buffer sizes
self.server.setsockopt(socket.SOL_TCP, socket.TCP_NODELAY, 1)
```

---

## 🎯 Deployment Summary

| Platform | Ease | Cost | Best For |
|----------|------|------|----------|
| Vercel | ⭐⭐⭐⭐⭐ | Free-$$$$ | Web version, jamstack |
| Netlify | ⭐⭐⭐⭐⭐ | Free-$$$$ | Web version, static |
| Self-Hosted | ⭐⭐⭐ | $$-$$$$$ | Full control, Python server |
| AWS | ⭐⭐⭐ | $$-$$$$$ | Scalable, enterprise |
| Docker | ⭐⭐⭐⭐ | Variable | Multi-environment, CI/CD |

---

**Last Updated:** March 2026

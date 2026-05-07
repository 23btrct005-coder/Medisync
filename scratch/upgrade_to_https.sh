#!/bin/bash
# MediSync HTTPS & Reverse Proxy Deployment
set -e

echo "🔒 INITIATING CLINICAL HTTPS UPGRADE..."

# 1. Install Nginx
sudo apt-get update
sudo apt-get install -y nginx

# 2. Generate Self-Signed SSL Certificate (2048-bit)
echo "🔑 GENERATING CLINICAL ENCRYPTION KEYS..."
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/medisync.key \
  -out /etc/nginx/ssl/medisync.crt \
  -subj "/C=US/ST=State/L=City/O=MediSync/OU=Clinical/CN=164.52.213.234"

# 3. Configure Nginx as a Secure Reverse Proxy
echo "⚙️ CONFIGURING SECURE REVERSE PROXY..."
sudo cat <<EOF > /etc/nginx/sites-available/medisync
server {
    listen 80;
    server_name 164.52.213.234;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name 164.52.213.234;

    ssl_certificate /etc/nginx/ssl/medisync.crt;
    ssl_certificate_key /etc/nginx/ssl/medisync.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# 4. Activate Configuration
sudo ln -sf /etc/nginx/sites-available/medisync /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 5. Update Firewall
echo "🛡️ UPDATING FIREWALL FOR HTTPS..."
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "✅ HTTPS UPGRADE COMPLETE. CLINICAL DATA IS NOW ENCRYPTED."

#!/bin/bash
# MediSync OS Hardening Script
set -e

echo "🔒 INITIATING INSTITUTIONAL OS HARDENING..."

# 1. Update and install security tools
sudo apt-get update
sudo apt-get install -y ufw fail2ban

# 2. Configure Firewall
echo "🛡️ CONFIGURING CLINICAL FIREWALL..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
sudo ufw --force enable

# 3. Configure Fail2Ban for clinical protection
echo "🚫 ACTIVATING BRUTE-FORCE PROTECTION..."
sudo cat <<EOF > /etc/fail2ban/jail.local
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 1h

[medisync]
enabled = true
port = 8080
filter = nosniff
logpath = /var/log/syslog
maxretry = 10
bantime = 2h
EOF

sudo systemctl restart fail2ban

# 4. NGINX SECURE TUNNEL CONFIGURATION
echo "📡 CONFIGURING SECURE SSL TUNNEL..."
# Generate self-signed cert if missing
if [ ! -f /etc/ssl/certs/medisync.crt ]; then
    echo "🔑 GENERATING CLINICAL SSL CERTIFICATE..."
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/private/medisync.key \
        -out /etc/ssl/certs/medisync.crt \
        -subj "/C=IN/ST=Karnataka/L=Bengaluru/O=MediSync Health/OU=Clinical Systems/CN=164.52.213.234"
fi

cat <<EOF > /tmp/medisync_nginx
server {
    listen 80;
    server_name _;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name _;

    ssl_certificate /etc/letsencrypt/live/\$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/\$DOMAIN/privkey.pem;

    # Institutional Grade SSL Hardening
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;

    # HSTS (Force Secure Tunnel)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
sudo mv /tmp/medisync_nginx /etc/nginx/sites-available/default
sudo systemctl restart nginx || sudo service nginx restart

# 5. Kernel Hardening
echo "⚙️ HARDENING KERNEL NETWORK STACK..."
grep -q "net.ipv4.conf.all.accept_redirects" /etc/sysctl.conf || sudo cat <<EOF >> /etc/sysctl.conf
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.all.log_martians = 1
EOF
sudo sysctl -p

# 6. GLOBAL SSL CERTIFICATION (Multi-Domain)
echo "🛡️ PROVISIONING MULTI-DOMAIN SSL CERTIFICATE..."
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Domains to Secure
DOMAIN1="medisync-hospital.duckdns.org"
DOMAIN2="medisync-hos.ddns.net"

# Automatic SSL Deployment for Both Domains
sudo certbot --nginx -d $DOMAIN1 -d $DOMAIN2 --non-interactive --agree-tos --register-unsafely-without-email --redirect

echo "✅ INSTITUTIONAL SECURITY PROTOCOL COMPLETE."
echo "🔗 PRIMARY PORTAL: https://$DOMAIN1"
echo "🔗 SECONDARY PORTAL: https://$DOMAIN2"

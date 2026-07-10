#!/bin/bash

# MediSync Pro: Institutional Deployment Protocol
# Version: 2.0 (Gemini-Enhanced)
# Target OS: Ubuntu 22.04+

set -e

echo "🏥 INITIATING CLINICAL INFRASTRUCTURE BUILD..."

# 1. Update System
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git unzip build-essential wget openjdk-17-jdk maven

# 2. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Synchronize Registry
echo "📂 SYNCHRONIZING CLINICAL REGISTRY..."
if [ ! -d "Medisync" ]; then
    git clone https://github.com/23btrct005-coder/Medisync.git
    cd Medisync
else
    cd Medisync
    git pull origin main
fi

# 4. Environment Hardening
echo "⚙️ INJECTING SECURE CLINICAL CONTEXT..."
cat <<EOF > .env
PORT=8080
SPRING_PROFILES_ACTIVE=prod
BREVO_API_KEY="REPLACE_WITH_YOUR_SECURE_BREVO_KEY"
BREVO_SENDER_EMAIL="REPLACE_WITH_YOUR_SENDER_EMAIL"
GEMINI_API_KEY="REPLACE_WITH_YOUR_SECURE_GEMINI_KEY"
GEMINI_MODEL=gemini-flash-latest
GROQ_API_KEY="REPLACE_WITH_YOUR_SECURE_GROQ_KEY"
JWT_SECRET="REPLACE_WITH_YOUR_SECURE_JWT_SECRET"
SUPABASE_URL="REPLACE_WITH_YOUR_SUPABASE_URL"
SUPABASE_SERVICE_ROLE_KEY="REPLACE_WITH_YOUR_SUPABASE_ROLE_KEY"
SPRING_DATASOURCE_URL="REPLACE_WITH_YOUR_DB_URL"
SPRING_DATASOURCE_USERNAME="REPLACE_WITH_YOUR_DB_USERNAME"
SPRING_DATASOURCE_PASSWORD="REPLACE_WITH_YOUR_DB_PASSWORD"
RAZORPAY_KEY_ID="REPLACE_WITH_YOUR_RAZORPAY_ID"
RAZORPAY_KEY_SECRET="REPLACE_WITH_YOUR_RAZORPAY_SECRET"
EOF

# 5. Build Process
echo "🌐 BUILDING FRONTEND ASSETS..."
cd frontend
npm install
npm run build

echo "📦 BUNDLING INTO BACKEND..."
mkdir -p ../backend/src/main/resources/static
rm -rf ../backend/src/main/resources/static/*
cp -r dist/* ../backend/src/main/resources/static/

echo "🏛️ COMPILING UNIFIED CLINICAL JAR..."
cd ../backend
mvn clean package -DskipTests

# 6. Launch
echo "🚀 EXECUTING FINAL INSTITUTIONAL LAUNCH..."
fuser -k 8080/tcp || true
# Set environment variables from .env and launch
set -a
[ -f ../.env ] && . ../.env
set +a
nohup java -jar target/*.jar > ~/medisync_prod.log 2>&1 &

echo "✅ DEPLOYMENT SUCCESSFUL. ACCESS VIA PORT 8080."

#!/bin/bash

# MediSync HOS: Institutional Deployment Protocol for E2E Networks
# OS: Ubuntu 22.04 LTS
# Infrastructure: C3-8GB-946 (164.52.213.234)

set -e

echo "🛡️🏥 INITIATING INSTITUTIONAL REGISTRY CLEANUP..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git unzip build-essential wget

# 1. Install Java 17 & Maven
echo "🏛️ INSTALLING CLINICAL-GRADE JAVA RUNTIME..."
sudo apt-get install -y openjdk-17-jdk maven

# 2. Install Node.js 18 (LTS)
echo "🌐 INSTALLING FRONTEND ECOSYSTEM..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install Docker & Docker Compose
echo "🐳 CONTAINERIZING INFRASTRUCTURE..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi
sudo apt-get install -y docker-compose

# 4. Prepare Project
echo "📂 SYNCHRONIZING INSTITUTIONAL REGISTRY..."
cd ~/Medisync || { echo "❌ REGISTRY NOT FOUND. PLEASE CLONE MANUALLY."; exit 1; }
git pull origin main

# 5. Environment Configuration
echo "⚙️ HARDENING ENVIRONMENT CONFIGURATION..."
if [ ! -f .env ]; then
cat <<EOF > .env
PORT="8080"
SPRING_PROFILES_ACTIVE="prod"
BREVO_API_KEY="REPLACE_WITH_YOUR_SECURE_BREVO_KEY"
BREVO_SENDER_EMAIL="REPLACE_WITH_YOUR_SENDER_EMAIL"
GEMINI_API_KEY="REPLACE_WITH_YOUR_SECURE_GEMINI_KEY"
GROQ_API_KEY="REPLACE_WITH_YOUR_SECURE_GROQ_KEY"
JWT_SECRET="REPLACE_WITH_YOUR_SECURE_JWT_SECRET"
OPENAI_API_KEY="REPLACE_WITH_YOUR_SECURE_OPENAI_KEY"
RAZORPAY_KEY_ID="REPLACE_WITH_YOUR_RAZORPAY_ID"
RAZORPAY_KEY_SECRET="REPLACE_WITH_YOUR_RAZORPAY_SECRET"
SPRING_DATASOURCE_PASSWORD="REPLACE_WITH_YOUR_DB_PASSWORD"
SPRING_DATASOURCE_URL="REPLACE_WITH_YOUR_DB_URL"
SPRING_DATASOURCE_USERNAME="REPLACE_WITH_YOUR_DB_USERNAME"
SUPABASE_SERVICE_ROLE_KEY="REPLACE_WITH_YOUR_SUPABASE_ROLE_KEY"
SUPABASE_URL="REPLACE_WITH_YOUR_SUPABASE_URL"
EOF
fi

# 6. Build & Launch
echo "🚀 EXECUTING UNIFIED INSTITUTIONAL LAUNCH..."

# Build Frontend First
echo "🌐 BUILDING FRONTEND..."
cd frontend
npm install
npm run build

# Bundle Frontend into Backend Resources
echo "📦 BUNDLING FRONTEND INTO BACKEND..."
mkdir -p ../backend/src/main/resources/static
rm -rf ../backend/src/main/resources/static/*
cp -r dist/* ../backend/src/main/resources/static/

# Build Unified Backend
echo "🏛️ BUILDING UNIFIED BACKEND..."
cd ../backend
mvn clean package -DskipTests

# Final Launch
echo "🚀 LAUNCHING MEDISYNC..."
fuser -k 8080/tcp || true
# Source environment variables before launching the JAR
set -a && source ../.env && set +a && nohup java -jar target/*.jar > ~/medisync.log 2>&1 &

echo "✅ INSTITUTIONAL REGISTRY IMPLEMENTED SUCCESSFULLY ON E2E!"

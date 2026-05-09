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

# 4. Environment Hardening (Now inside project root)
echo "⚙️ INJECTING SECURE CLINICAL CONTEXT..."
cat <<EOF > .env
PORT=8080
SPRING_PROFILES_ACTIVE=prod
BREVO_API_KEY=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
BREVO_SENDER_EMAIL=23btrct005@jainuniversity.ac.in
GEMINI_API_KEY="REPLACE_WITH_YOUR_SECURE_GEMINI_KEY"
GEMINI_MODEL=gemini-1.5-pro
GROQ_API_KEY=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
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
SUPABASE_URL=https://bwjmzottkkxrdztqqeju.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3am16b3R0a2t4cmR6dHFxZWp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc1MjgxOCwiZXhwIjoyMDkxMzI4ODE4fQ.x_ZXzqNsDnmCTyd5YLXWLhaXHgbfVuL9CNdHSEyF0aY
SPRING_DATASOURCE_URL="jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:5432/postgres?user=postgres.bwjmzottkkxrdztqqeju&password=Medisync2024&ssl=true&sslmode=require&sslfactory=org.postgresql.ssl.NonValidatingFactory"
SPRING_DATASOURCE_USERNAME=postgres.bwjmzottkkxrdztqqeju
SPRING_DATASOURCE_PASSWORD=Medisync2024
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
# Export variables from .env (now in project root) and launch
export $(grep -v '^#' ../.env | xargs)
nohup java -jar target/*.jar > ~/medisync_prod.log 2>&1 &

echo "✅ DEPLOYMENT SUCCESSFUL. ACCESS VIA PORT 8080."

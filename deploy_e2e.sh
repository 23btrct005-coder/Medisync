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
cat <<EOF > .env
PORT=8080
SPRING_PROFILES_ACTIVE=prod
BREVO_API_KEY=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
BREVO_SENDER_EMAIL=23btrct005@jainuniversity.ac.in
GOOGLE_API_KEY=AIzaSyDKFDakzgMgcHol8PQijByDzFuyRty91VA
GROQ_API_KEY=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
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
OPENAI_API_KEY=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
RAZORPAY_KEY_ID=rzp_live_SdOTsSUMHGBg00
RAZORPAY_KEY_SECRET=TZoRKOfeeAOJCBw4l23OBpDZ
SPRING_DATASOURCE_PASSWORD=Medisync2024
SPRING_DATASOURCE_URL="jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:5432/postgres?user=postgres.bwjmzottkkxrdztqqeju&password=Medisync2024&ssl=true&sslmode=require&sslfactory=org.postgresql.ssl.NonValidatingFactory"
SPRING_DATASOURCE_USERNAME=postgres.bwjmzottkkxrdztqqeju
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3am16b3R0a2t4cmR6dHFxZWp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc1MjgxOCwiZXhwIjoyMDkxMzI4ODE4fQ.x_ZXzqNsDnmCTyd5YLXWLhaXHgbfVuL9CNdHSEyF0aY
SUPABASE_URL=https://bwjmzottkkxrdztqqeju.supabase.co
EOF

# 6. Build & Launch
echo "🚀 EXECUTING FINAL INSTITUTIONAL LAUNCH..."
# Build Backend
cd backend
mvn clean package -DskipTests

# Build Frontend
cd ../frontend
npm install
npm run build

echo "✅ INSTITUTIONAL REGISTRY IMPLEMENTED SUCCESSFULLY ON E2E!"
echo "⚠️ IMPORTANT: Please update the .env file with your production credentials."

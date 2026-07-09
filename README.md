# 🏥 Medisync Health

Medisync is a comprehensive, full-stack health-tech platform designed to seamlessly bridge the gap between patients, healthcare professionals, and hospitals. It features an advanced AI Clinical Assistant, secure telemedicine capabilities, and a robust appointment and hospital service scheduling system.

## 🌟 Key Features

* **AI Clinical Assistant (Copilot):** An intelligent, medical-grade AI assistant that helps triage patient symptoms and recommends the correct specialist. It is powered by a highly resilient **3-Tier AI Fallback Chain** (Google Gemini -> OpenAI ChatGPT-4o -> Groq Llama-3) to ensure 100% uptime.
* **Full-Service Booking System:** Patients can discover physicians, book online/offline consultations, and schedule institutional diagnostic services (like MRIs, X-Rays, Surgeries, and Blood Banks).
* **Location-Aware Services:** Integrates with browser geolocation to find the nearest hospitals and doctors, especially critical for Ambulance booking.
* **Telemedicine & Chat:** Real-time WebSockets integration for doctor-patient messaging and secure sessions.
* **Payment Gateway Integration:** Integrated securely with Razorpay for handling consultation fees and hospital service payments.
* **Cross-Platform:** Built as a responsive web app but fully configured with **Capacitor** to be wrapped and deployed as native Android and iOS applications.

---

## 🏗️ Architecture & Tech Stack

### Frontend (Client-Side)
* **Framework:** React 18, Vite
* **Styling:** Tailwind CSS, Framer Motion (for micro-animations)
* **Routing:** React Router v6
* **Mobile Portability:** Ionic Capacitor (Android/iOS)
* **Icons:** Lucide React
* **State & Data:** Axios, React Hot Toast

### Backend (Server-Side)
* **Framework:** Spring Boot 3.2 (Java 17)
* **Database:** PostgreSQL (hosted on Supabase) utilizing HikariCP for connection pooling.
* **Security:** Spring Security with JSON Web Tokens (JWT) for stateless authentication.
* **Real-time:** Spring WebSocket with STOMP.
* **Integrations:** 
  * Razorpay Java SDK (Payments)
  * PDFBox (Medical document parsing)
  * JavaMailSender (Email notifications)

---

## 🚀 Environment Configuration

To run Medisync locally or deploy it to a server (like Render), you must configure the following environment variables in your backend's application environment (or `.env` file):

### Database Configuration
* `SPRING_DATASOURCE_URL`: JDBC URL for your PostgreSQL database (e.g., Supabase)
* `SPRING_DATASOURCE_USERNAME`: Database username
* `SPRING_DATASOURCE_PASSWORD`: Database password

### AI Engine Fallback Chain (Critical)
* `GEMINI_API_KEY`: Google Gemini API Key (Primary Engine)
* `OPENAI_API_KEY`: OpenAI API Key (Secondary Fallback)
* `GROQ_API_KEY`: Groq API Key (Tertiary Fallback)

### Payment Gateway
* `RAZORPAY_KEY_ID`: Your Razorpay Key ID
* `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret

---

## 🛠️ Local Development Guide

### 1. Starting the Backend
1. Ensure you have **Java 17** installed.
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Run the Spring Boot application using Maven:
   ```bash
   ./mvnw spring-boot:run
   ```
   *(The backend will start on `http://localhost:8080`)*

### 2. Starting the Frontend
1. Ensure you have **Node.js** installed (v18+ recommended).
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *(The frontend will start on `http://localhost:5173`)*

---

## 📱 Mobile Application Build (Android/iOS)
The frontend is already configured with Capacitor.

**To build the Android app:**
```bash
cd frontend
npm run build
npx cap sync android
npx cap open android
```
*(This will open the project in Android Studio where you can build the APK).*

# FYP Evaluation & Assessment Management System - Backend

> A comprehensive NestJS-based Final Year Project (FYP) evaluation management system with AI-powered analysis, real-time chat, and role-based dashboards.

**Author:** Assad Wazeer 

## 🎯 Features Overview

✅ **Role-Based Access Control** - Admin, Supervisor, Student, Committee, External Evaluator  
✅ **Dynamic Evaluation Phases** - Proposal, Mid, Progress, Final Defense  
✅ **AI-Powered Analysis** - Gemini, OpenAI, Groq integration  
✅ **Document Management** - Upload, parse, and analyze proposals  
✅ **Real-Time Chat** - WebSocket-based messaging system  
✅ **Email Notifications** - Gmail SMTP integration  
✅ **Group Management** - Student group handling  
✅ **Evaluation Tracking** - Score weightage and final result calculation  
✅ **JWT Authentication** - Secure token-based auth  

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- **Node.js** v18+ ([Download](https://nodejs.org/))
- **PostgreSQL** v14+ ([Download](https://www.postgresql.org/))
- **Git** ([Download](https://git-scm.com/))
- **npm** or **yarn**

### 1. Clone Repository

git clone <repo>
cd <folder name>

### 2. Install Dependencies

npm install

### 3. Database Setup

# Login to PostgreSQL
sudo -u postgres psql

# Create user and database
ALTER USER postgres WITH PASSWORD 'postgres';
CREATE DATABASE fyp_evaluation;
\q


### 4. Environment Configuration
# Create .env file
nano .env

Paste this configuration:
env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=fyp_evaluation
DB_SYNCHRONIZE=false

# Server
PORT=3000
NODE_ENV=development

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_EXPIRATION=1d

# Email Configuration (Gmail)
EMAIL=your_email@gmail.com
EMAIL_PASS=your_app_password

# AI APIs (Optional)

OPENAI_API_KEY=your_openai_api_key


# File Upload
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_KEY=your_cloudinary_key
CLOUDINARY_SECRET=your_cloudinary_secret


**Save:** `Ctrl+O` → `Enter` → `Ctrl+X`

### 5. Run Application
bash
# Development mode (with hot-reload)
npm run start:dev

# Production mode
npm run build
npm start


✅ **Server is running:** `http://localhost:3000


## 📊 Project Structure



## 🛠️ Available Commands

`bash
# Development
npm run start:dev                  # Hot-reload development server
npm run start:debug               # Debug mode

# Production
npm run build                      # Compile TypeScript to JavaScript
npm start                          # Run compiled app

# Code Quality
npm run lint                       # Run ESLint
npm run format                     # Format code with Prettier

## 🔧 Environment Variables Explained


# Database Connection
DB_HOST              - PostgreSQL host (default: localhost)
DB_PORT              - PostgreSQL port (default: 5432)
DB_USERNAME          - Database user (default: postgres)
DB_PASSWORD          - Database password
DB_NAME              - Database name (default: fyp_evaluation)
DB_SYNCHRONIZE       - Auto-sync TypeORM entities (false in prod)

# Server
PORT                 - Server port (default: 3000)
NODE_ENV             - Environment (development/production)

# Authentication
JWT_SECRET           - Secret key for JWT (min 32 characters)
JWT_EXPIRATION       - Token expiration time (default: 1d)

# Email Notifications
EMAIL                - Gmail address for sending emails
EMAIL_PASS           - Gmail app-specific password

# AI Services
GEMINI_API_KEY       - Google Gemini API key
OPENAI_API_KEY       - OpenAI API key
GROQ_API_KEY         - Groq API key

# File Upload
CLOUDINARY_NAME      - Cloudinary account name
CLOUDINARY_KEY       - Cloudinary API key
CLOUDINARY_SECRET    - Cloudinary API secret

## 📦 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| NestJS | 11.0+ | Framework |
| TypeORM | 0.3+ | ORM |
| PostgreSQL | 14+ | Database |
| JWT | 11.0+ | Authentication |
| Multer | 2.2+ | File upload |
| Socket.io | 4.8+ | Real-time chat |
| Gemini AI | 0.24+ | AI integration |
| OpenAI | 6.16+ | AI integration |
| Nodemailer | 8.0+ | Email |
| Passport | 0.7+ | Auth strategy |
| Cloudinary | 2.10+ | Cloud storage |

---

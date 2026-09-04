# 🎓 FYP Evaluation & Assessment Management System

A comprehensive **NestJS-based Final Year Project (FYP) Evaluation & Assessment Management System** designed to streamline project management, evaluation workflows, supervisor assignments, document reviews, and AI-powered project analysis.

**Author:** Assad Wazeer

---

# 📌 Overview

The FYP Evaluation & Assessment Management System helps universities manage the complete Final Year Project lifecycle, including:

* Student project submissions
* Supervisor allocation
* Dynamic evaluation phases
* Committee reviews
* External evaluations
* AI-powered proposal analysis
* Real-time communication
* Automated notifications

The system supports multiple user roles with dedicated dashboards and permissions.

---

# ✨ Features

### 🔐 Authentication & Authorization

* JWT-based authentication
* Role-Based Access Control (RBAC)
* Secure route protection

### 👥 User Roles

* Admin
* Student
* Supervisor
* Committee Member
* External Evaluator

### 📚 Project Management

* FYP idea submission
* Project proposal management
* Group creation & management
* Supervisor assignment
* Project progress tracking

### 📊 Dynamic Evaluation System

* Proposal Evaluation
* Mid Evaluation
* Progress Evaluation
* Final Defense Evaluation
* Configurable score weightages
* Automatic final result calculation

### 🤖 AI-Powered Analysis

* Proposal analysis
* Duplicate project detection
* Project recommendation system
* Feasibility assessment
* AI-generated feedback

### 📄 Document Management

* Proposal upload
* Document storage
* Cloudinary integration
* File parsing & analysis

### 💬 Real-Time Communication

* WebSocket-based chat
* Instant messaging
* Notifications

### 📧 Email Notifications

* Gmail SMTP integration
* Automated alerts
* Evaluation notifications
* Assignment notifications

---

# 🛠️ Tech Stack

| Category                | Technology           |
| ----------------------- | -------------------- |
| Backend Framework       | NestJS               |
| Language                | TypeScript           |
| Database                | PostgreSQL           |
| ORM                     | TypeORM              |
| Authentication          | JWT + Passport       |
| File Upload             | Multer               |
| Cloud Storage           | Cloudinary           |
| Real-Time Communication | Socket.io            |
| AI Services             | Gemini, OpenAI, Groq |
| Email Service           | Nodemailer           |
| API Style               | REST API             |

---

# 📁 Project Structure

```text
src/
│
├── auth/
│   ├── controllers/
│   ├── services/
│   ├── guards/
│   ├── strategies/
│   └── dto/
│
├── users/
│   ├── controllers/
│   ├── services/
│   ├── entities/
│   └── dto/
│
├── students/
├── supervisors/
├── committees/
├── external-evaluators/
│
├── groups/
│   ├── controllers/
│   ├── services/
│   └── entities/
│
├── projects/
│   ├── controllers/
│   ├── services/
│   ├── entities/
│   └── dto/
│
├── evaluations/
│   ├── controllers/
│   ├── services/
│   ├── entities/
│   └── dto/
│
├── documents/
│   ├── controllers/
│   ├── services/
│   └── entities/
│
├── ai/
│   ├── services/
│   ├── providers/
│   └── prompts/
│
├── chat/
│   ├── gateways/
│   ├── services/
│   └── entities/
│
├── notifications/
│   ├── services/
│   └── templates/
│
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── utils/
│
├── database/
│   ├── entities/
│   ├── migrations/
│   └── seeds/
│
├── config/
│
├── app.module.ts
└── main.ts
```

---

# 🚀 Getting Started

## Prerequisites

Install the following software:

* Node.js v18+
* PostgreSQL v14+
* Git
* npm

---

## 1. Clone Repository

```bash
git clone https://github.com/assad177/fyp-management-system.git

cd Fyp-management-system/FYP-BACKEND/fyp_backend
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Database Setup

Login to PostgreSQL:

```bash
sudo -u postgres psql
```

Create database:

```sql
ALTER USER postgres WITH PASSWORD 'postgres';

CREATE DATABASE fyp_evaluation;

\q
```

---

## 4. Environment Configuration

Create a `.env` file in the project root.

```env
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

# JWT
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_EXPIRATION=1d

# Email
EMAIL=your_email@gmail.com
EMAIL_PASS=your_app_password

# AI APIs
GEMINI_API_KEY=
OPENAI_API_KEY=
GROQ_API_KEY=

# Cloudinary
CLOUDINARY_NAME=
CLOUDINARY_KEY=
CLOUDINARY_SECRET=
```

---

## 5. Run Application

### Development Mode

```bash
npm run start:dev
```

### Debug Mode

```bash
npm run start:debug
```

### Production Mode

```bash
npm run build

npm start
```

Application will be available at:

```text
http://localhost:3000
```

---

# ⚙️ Available Commands

## Development

```bash
npm run start
npm run start:dev
npm run start:debug
```

## Build

```bash
npm run build
```

## Code Quality

```bash
npm run lint
npm run format
```

---

# 🔑 Environment Variables

## Database

| Variable       | Description             |
| -------------- | ----------------------- |
| DB_HOST        | PostgreSQL host         |
| DB_PORT        | PostgreSQL port         |
| DB_USERNAME    | Database username       |
| DB_PASSWORD    | Database password       |
| DB_NAME        | Database name           |
| DB_SYNCHRONIZE | TypeORM synchronization |

## Authentication

| Variable       | Description           |
| -------------- | --------------------- |
| JWT_SECRET     | JWT secret key        |
| JWT_EXPIRATION | Token expiration time |

## Email

| Variable   | Description        |
| ---------- | ------------------ |
| EMAIL      | Gmail address      |
| EMAIL_PASS | Gmail App Password |

## AI Services

| Variable       | Description       |
| -------------- | ----------------- |
| GEMINI_API_KEY | Google Gemini API |
| OPENAI_API_KEY | OpenAI API        |
| GROQ_API_KEY   | |

## Cloudinary

| Variable          | Description           |
| ----------------- | --------------------- |
| CLOUDINARY_NAME   | Cloudinary Cloud Name |
| CLOUDINARY_KEY    | Cloudinary API Key    |
| CLOUDINARY_SECRET | Cloudinary Secret Key |

---

# 📦 Key Dependencies

| Package    | Purpose                 |
| ---------- | ----------------------- |
| NestJS     | Backend Framework       |
| TypeORM    | Database ORM            |
| PostgreSQL | Relational Database     |
| JWT        | Authentication          |
| Passport   | Auth Strategy           |
| Socket.io  | Real-Time Communication |
| Multer     | File Upload             |
| Cloudinary | Cloud Storage           |
| Nodemailer | Email Service           |
| Gemini AI  | AI Analysis             |
| OpenAI     | AI Analysis             |
| Groq       | AI Processing           |

---





# 🎓 FYP Evaluation & Assessment Management System

A comprehensive **NestJS-based Final Year Project (FYP) Evaluation & Assessment Management System** that streamlines project submission, supervisor allocation, committee reviews, evaluation workflows, document management, and AI-powered proposal analysis.

**Author:** Assad Wazeer

---

# 📌 Overview

The FYP Evaluation & Assessment Management System is designed for universities to manage the complete lifecycle of Final Year Projects.

The platform enables:

* Student project proposal submissions
* Supervisor assignment and management
* Committee assignment and evaluation
* Multi-phase project assessment
* Real-time communication
* AI-powered proposal analysis
* Automated notifications
* Centralized project tracking

---

# ✨ Features

## 🔐 Authentication & Authorization

* JWT Authentication
* Role-Based Access Control (RBAC)
* Secure API Endpoints
* Protected Routes

## 👥 User Roles

* Admin / FYP Office
* Student
* Supervisor
* Committee Member
* External Evaluator

## 📚 Project Management

* Proposal Submission
* Project Tracking
* Supervisor Assignment
* Group Management
* Supervisor Idea Suggestions

## 📊 Evaluation Management

* Proposal Evaluation
* Mid Evaluation
* Progress Evaluation
* Final Defense Evaluation
* Dynamic Evaluation Criteria
* Score Weightage Calculation
* Final Result Generation

## 🤖 AI Integration

* Gemini AI Analysis
* Proposal Quality Assessment
* Duplicate Idea Detection
* Project Recommendations
* Feasibility Analysis

## 📄 Document Management

* Proposal Upload
* Document Processing
* Cloudinary Storage
* PDF & DOCX Analysis

## 💬 Real-Time Communication

* Socket.IO Based Chat
* Student ↔ Supervisor Communication
* Committee Discussions
* Instant Notifications

## 📧 Email Notifications

* Gmail SMTP Integration
* Automated Alerts
* Assignment Notifications
* Evaluation Notifications

---

# 🛠️ Tech Stack

| Technology | Purpose                 |
| ---------- | ----------------------- |
| NestJS     | Backend Framework       |
| TypeScript | Programming Language    |
| PostgreSQL | Database                |
| TypeORM    | ORM                     |
| JWT        | Authentication          |
| Passport   | Authentication Strategy |
| Socket.IO  | Real-Time Communication |
| Multer     | File Upload             |
| Cloudinary | Cloud Storage           |
| Nodemailer | Email Service           |
| Gemini AI  | AI Analysis             |
| OpenAI     | AI Processing           |
| Groq       | AI Processing           |

---

# 📁 Project Structure

```text
src/
│
├── auth/                          # Authentication & Authorization
│
├── users/                         # User Management
│
├── students/                      # Student Operations
│
├── supervisor/                    # Supervisor Management
│   ├── entities/
│   │   ├── supervisor.entity.ts
│   │   └── supervision.request.entity.ts
│   ├── supervisor.controller.ts
│   ├── supervisor.service.ts
│   └── supervisor.module.ts
│
├── groups/                        # Student Group Management
│   ├── entities/
│   │   └── group.entity.ts
│   ├── groups.controller.ts
│   ├── groups.service.ts
│   └── groups.module.ts
│
├── proposal/                      # Proposal Submission
│
├── proposal-evaluation/           # Proposal Review & Evaluation
│
├── evaluation/                    # Mid, Progress & Final Evaluations
│
├── committee-assignment/          # Committee Assignment
│
├── supervisor-idea/               # Supervisor Suggested Ideas
│
├── fyp-office/                    # Administrative Operations
│
├── chat/                          # Real-Time Messaging
│   ├── entities/
│   │   └── Message.entity.ts
│   ├── chat.gateway.ts
│   ├── chat.controller.ts
│   ├── chat.service.ts
│   └── chat.module.ts
│
├── gemini/                        # AI Services
│
├── config/
│   └── typeOrm.config.ts
│
├── app.controller.ts
├── app.service.ts
├── app.module.ts
└── main.ts
```

---

# 🚀 Getting Started

## Prerequisites

Make sure the following software is installed:

* Node.js v18+
* PostgreSQL v14+
* Git
* npm

---

## 1. Clone Repository

```bash
git clone https://github.com/assad177/fyp-management-system.git

cd FYP-BACKEND/fyp_backend
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure PostgreSQL

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
JWT_SECRET=your_secure_jwt_secret_key
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

### Production Build

```bash
npm run build
npm run start:prod
```

---

# 🌐 API Base URL

```text
http://localhost:3000/api
```

Example:

```text
http://localhost:3000/api/auth/login
```

---

# ⚙️ Available Commands

## Development

```bash
npm run start
npm run start:dev
npm run start:debug
```

## Production

```bash
npm run build
npm run start:prod
```

## Testing

```bash
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
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
| DB_HOST        | PostgreSQL Host         |
| DB_PORT        | PostgreSQL Port         |
| DB_USERNAME    | Database Username       |
| DB_PASSWORD    | Database Password       |
| DB_NAME        | Database Name           |
| DB_SYNCHRONIZE | TypeORM Synchronization |

## Authentication

| Variable       | Description           |
| -------------- | --------------------- |
| JWT_SECRET     | JWT Secret Key        |
| JWT_EXPIRATION | Token Expiration Time |

## Email

| Variable   | Description        |
| ---------- | ------------------ |
| EMAIL      | Gmail Address      |
| EMAIL_PASS | Gmail App Password |

## AI Services

| Variable       | Description           |
| -------------- | --------------------- |
| GEMINI_API_KEY | Google Gemini API Key |
| OPENAI_API_KEY | OpenAI API Key        |
| GROQ_API_KEY   | Groq API Key          |

## Cloudinary

| Variable          | Description |
| ----------------- | ----------- |
| CLOUDINARY_NAME   | Cloud Name  |
| CLOUDINARY_KEY    | API Key     |
| CLOUDINARY_SECRET | API Secret  |

---

# 📦 Major Dependencies

| Package    | Version |
| ---------- | ------- |
| NestJS     | 11.x    |
| TypeORM    | 0.3.x   |
| PostgreSQL | 14+     |
| JWT        | 11.x    |
| Passport   | 0.7.x   |
| Socket.IO  | 4.x     |
| Multer     | 2.x     |
| Cloudinary | 2.x     |
| Nodemailer | 8.x     |
| Gemini AI  | Latest  |
| OpenAI     | Latest  |
| Groq SDK   | Latest  |

---

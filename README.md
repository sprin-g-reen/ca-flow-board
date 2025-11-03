# 📊 CA Flow Board# CA Flow Board



> *Intelligent Workflow Management for Modern CA Firms*A comprehensive Chartered Accountant (CA) firm management platform designed to automate and streamline every aspect of CA operations. Built with modern technologies including React.js, Node.js, Express.js, MongoDB, JWT authentication, and Razorpay payment integration.



A comprehensive enterprise-grade platform designed specifically for Chartered Accountant firms to automate workflows, manage clients, process payments, and streamline compliance operations. Built with cutting-edge technologies for scalability, security, and performance.## 🚀 Features



[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)### Core Functionality

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)- **Client Management**: Centralized client database with contact info, engagement history, and document vault

[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)- **Task Management**: Create, assign, and track tasks with deadlines, priorities, and recurring schedules

[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)- **Invoicing & Payments**: Automated invoice generation with Razorpay integration for online payments

- **Document Management**: Secure upload, storage, and sharing of documents

---- **Role-based Access Control**: Granular permissions for Super Admin, Admin, Owner, Employee, and Client roles



## 🎯 Overview### Advanced Features

- **Automated Workflows**: Recurring task templates for GST filing, TDS returns, and compliance

CA Flow Board transforms how CA firms operate by providing an integrated platform that handles everything from client onboarding to invoice payments. Designed by CAs for CAs, it addresses real-world challenges in practice management while ensuring compliance and efficiency.- **Real-time Analytics**: Performance dashboards and financial reporting

- **Email & WhatsApp Integration**: Automated notifications and client communication

### ✨ Key Highlights- **GST Compliance**: Built-in GST calculation and reporting features

- **Mobile Responsive**: Optimized for desktop, tablet, and mobile devices

- **🏢 Multi-Firm Support** - Manage multiple CA firms from a single dashboard

- **⚡ Automated Workflows** - Recurring tasks, deadline reminders, and compliance tracking## 🛠️ Technology Stack

- **💳 Integrated Payments** - Razorpay integration with GST calculations and digital receipts

- **📱 Mobile-First Design** - Responsive interface optimized for all devices### Frontend

- **🔐 Enterprise Security** - Role-based access control with JWT authentication- **React.js** - Modern UI framework with TypeScript

- **📊 Advanced Analytics** - Performance metrics and financial reporting- **Vite** - Fast build tool

- **ShadCN UI** - Component library

---- **Tailwind CSS** - Utility-first styling

- **Redux Toolkit** - State management

## 🚀 Features

### Backend

### 🏗️ Core Management- **Node.js & Express.js** - Server framework

| Feature | Description |- **MongoDB** - Database with Mongoose ODM

|---------|-------------|- **JWT** - Authentication system

| **Client Portal** | Complete client lifecycle management with document vault |- **Razorpay** - Payment processing

| **Task Engine** | Intelligent task assignment with priority and deadline tracking |

| **Invoice System** | Automated billing with payment link generation |## 📋 Prerequisites

| **Document Hub** | Secure file storage with version control and sharing |

| **Team Management** | Role-based permissions for different team members |- **Node.js** (v18 or higher)

- **MongoDB** (v6 or higher)

### 🤖 Automation & Intelligence- **npm** or **yarn**

- **Recurring Task Templates** - GST filing, TDS returns, annual compliance

- **Smart Deadline Tracking** - Automated reminders via email and WhatsApp## 🚀 Quick Start

- **Performance Analytics** - Team productivity and revenue insights

- **Compliance Dashboard** - Real-time status of regulatory requirements### 1. Clone & Install

- **Client Communication** - Automated notifications and updates\`\`\`bash

git clone https://github.com/Rohith-sreedharan/ca-flow-board.git

### 💼 Business Featurescd ca-flow-board

- **Multi-Currency Support** - Handle clients across different regionsnpm run setup

- **GST Integration** - Built-in tax calculations and filing support\`\`\`

- **Razorpay Payments** - Secure online payment processing

- **Email Templates** - Professional communication templates### 2. Environment Setup

- **Custom Workflows** - Tailor processes to your firm's needs

#### Frontend (.env)

---\`\`\`env

VITE_API_URL=http://localhost:5000/api

## 🛠️ Technology ArchitectureVITE_RAZORPAY_KEY_ID=your_razorpay_key_id

\`\`\`

### Frontend Stack

```#### Backend (backend/.env)

React 18+ with TypeScript  →  Modern, type-safe UI development\`\`\`env

Vite Build System         →  Lightning-fast development experienceNODE_ENV=development

ShadCN UI Components      →  Beautiful, accessible design systemPORT=5000

Tailwind CSS              →  Utility-first styling approachMONGODB_URI=mongodb://localhost:27017/ca-flow-board

Redux Toolkit             →  Predictable state managementJWT_SECRET=your-super-secure-jwt-secret-32-chars-min

React Query               →  Efficient server state managementRAZORPAY_KEY_ID=your_razorpay_key_id

```RAZORPAY_KEY_SECRET=your_razorpay_key_secret

\`\`\`

### Backend Stack

```### 3. Start MongoDB

Node.js + Express.js      →  Scalable server architecture\`\`\`bash

MongoDB + Mongoose        →  Flexible document database# macOS

JWT Authentication        →  Secure, stateless authenticationbrew services start mongodb-community

Razorpay SDK              →  Payment processing integration

Rate Limiting             →  API protection and throttling# Ubuntu

CORS & Security Headers   →  Cross-origin securitysudo systemctl start mongod

```\`\`\`



### DevOps & Tools### 4. Run Application

```\`\`\`bash

ESLint + TypeScript       →  Code quality and type safetynpm run dev  # Starts both frontend and backend

Prettier                  →  Consistent code formatting\`\`\`

Git Hooks                 →  Pre-commit quality checks

Environment Configs       →  Secure configuration management### 5. Access Application

```- **Frontend**: http://localhost:5173

- **Backend API**: http://localhost:5000/api

---

## 👤 Default Login

## 📋 System Requirements

- **Email**: rohith@springreen.in

### Development Environment- **Password**: springreen.in

- **Node.js** `v18.0.0` or higher

- **MongoDB** `v6.0` or higherUse "Create Owner Account" button on first visit.

- **npm** `v8.0.0` or higher (or **yarn** `v1.22.0+`)

- **Git** for version control## 🔧 Development Scripts



### Recommended System Specs\`\`\`bash

- **RAM**: 8GB minimum, 16GB recommendednpm run dev              # Start both frontend & backend

- **Storage**: 10GB free spacenpm run dev:frontend     # Frontend only

- **OS**: macOS 10.15+, Ubuntu 20.04+, Windows 10+npm run backend:dev      # Backend only

npm run build           # Build for production

---npm run setup           # Install all dependencies

\`\`\`

## 🚀 Quick Start Guide

## 🏗️ Project Structure

### 1️⃣ Repository Setup

```bash\`\`\`

# Clone the repositoryca-flow-board/

git clone https://github.com/Rohith-sreedharan/ca-flow-board.git├── src/                 # Frontend React app

cd ca-flow-board│   ├── components/      # UI components

│   ├── pages/          # Page components

# Install all dependencies (frontend + backend)│   ├── services/       # API services

npm run setup│   └── store/          # Redux store

```├── backend/            # Node.js/Express server

│   ├── models/         # MongoDB models

### 2️⃣ Environment Configuration│   ├── routes/         # API routes

│   ├── middleware/     # Auth & validation

#### Frontend Environment (`.env`)│   └── services/       # Business logic

```env\`\`\`

# API Configuration

VITE_API_URL=http://localhost:5000/api## 💳 Razorpay Integration

VITE_APP_NAME="CA Flow Board"

### Setup Razorpay

# Razorpay Configuration1. Create account at [Razorpay Dashboard](https://dashboard.razorpay.com/)

VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id2. Get API keys from Settings → API Keys

VITE_RAZORPAY_THEME_COLOR=#3B82F63. Add keys to environment variables

```4. Setup webhooks (optional): `/api/payments/webhook`



#### Backend Environment (`backend/.env`)### Payment Features

```env- Invoice payment processing

# Server Configuration- Payment links generation

NODE_ENV=development- Webhook handling for payment updates

PORT=5000- GST calculation for Indian businesses

API_VERSION=v1- Automatic invoice status updates



# Database Configuration## 🔒 Security Features

MONGODB_URI=mongodb://localhost:27017/ca-flow-board

DB_NAME=ca-flow-board- JWT authentication with role-based access

- Password hashing with bcryptjs

# Authentication- Request rate limiting

JWT_SECRET=your-ultra-secure-jwt-secret-minimum-32-characters- Input validation and sanitization

JWT_EXPIRES_IN=7d- CORS protection

REFRESH_TOKEN_SECRET=your-refresh-token-secret-minimum-32-characters

## 📚 API Endpoints

# Razorpay Configuration

RAZORPAY_KEY_ID=rzp_test_your_key_id### Authentication

RAZORPAY_KEY_SECRET=your_razorpay_key_secret- `POST /api/auth/login` - User login

RAZORPAY_WEBHOOK_SECRET=your_webhook_secret- `POST /api/auth/register` - Register user

- `GET /api/auth/me` - Get current user

# Email Configuration (Optional)

SMTP_HOST=smtp.gmail.com### Payments

SMTP_PORT=587- `POST /api/payments/create-order` - Create payment order

SMTP_USER=your-email@gmail.com- `POST /api/payments/verify` - Verify payment

SMTP_PASS=your-app-password- `POST /api/payments/webhook` - Payment webhooks



# File Upload### Management

MAX_FILE_SIZE=10MB- `/api/users` - User management

UPLOAD_PATH=./uploads- `/api/clients` - Client management  

```- `/api/tasks` - Task management

- `/api/invoices` - Invoice management

### 3️⃣ Database Setup

```bash## 🚀 Deployment

# Start MongoDB service

# macOS (Homebrew)### Environment Variables (Production)

brew services start mongodb-community@7.0\`\`\`env

NODE_ENV=production

# Ubuntu/DebianMONGODB_URI=your_production_mongodb_url

sudo systemctl start mongodJWT_SECRET=your_production_jwt_secret

sudo systemctl enable mongodRAZORPAY_KEY_ID=rzp_live_your_live_key

RAZORPAY_KEY_SECRET=your_live_secret

# Windows\`\`\`

net start MongoDB

### Build & Deploy

# Verify MongoDB is running\`\`\`bash

mongosh --eval "db.adminCommand('ismaster')"npm run build

```cd backend && npm start

\`\`\`

### 4️⃣ Launch Application

```bash## 🤝 Contributing

# Start both frontend and backend concurrently

npm run dev1. Fork the repository

2. Create feature branch (\`git checkout -b feature/AmazingFeature\`)

# Alternative: Start separately3. Commit changes (\`git commit -m 'Add AmazingFeature'\`)

npm run dev:frontend  # Frontend only (port 5173)4. Push to branch (\`git push origin feature/AmazingFeature\`)

npm run backend:dev   # Backend only (port 5000)5. Open Pull Request

```

## 📝 License

### 5️⃣ Access Application

- **🌐 Frontend Application**: http://localhost:5173MIT License - see [LICENSE](LICENSE) file for details.

- **🔧 Backend API**: http://localhost:5000/api

- **📚 API Documentation**: http://localhost:5000/api/docs (if enabled)---



---**CA Flow Board** - Empowering CA firms with intelligent workflow solutions 🚀



## 👤 Initial Setup & AuthenticationSimply visit the [Lovable Project](https://lovable.dev/projects/d12963e7-766e-4f25-88cf-533ff3a12ba4) and start prompting.



### Default Administrator AccountChanges made via Lovable will be committed automatically to this repo.

```

Email: rohith@springreen.in**Use your preferred IDE**

Password: springreen.in

Role: Super AdminIf you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

```

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### First-Time Setup Flow

1. **Access Application** → Visit http://localhost:5173Follow these steps:

2. **Create Owner Account** → Click "Create Owner Account" button

3. **Setup Your Firm** → Complete firm registration form```sh

4. **Configure Payment Gateway** → Add Razorpay credentials in settings# Step 1: Clone the repository using the project's Git URL.

5. **Invite Team Members** → Add employees with appropriate rolesgit clone <YOUR_GIT_URL>

6. **Start Managing** → Begin client onboarding and task management

# Step 2: Navigate to the project directory.

---cd <YOUR_PROJECT_NAME>



## 🔧 Development Workflow# Step 3: Install the necessary dependencies.

npm i

### Available NPM Scripts

```bash# Step 4: Start the development server with auto-reloading and an instant preview.

# Developmentnpm run dev

npm run dev              # Start both frontend & backend```

npm run dev:frontend     # Frontend development server

npm run backend:dev      # Backend development server**Edit a file directly in GitHub**



# Building- Navigate to the desired file(s).

npm run build           # Build frontend for production- Click the "Edit" button (pencil icon) at the top right of the file view.

npm run backend:build   # Build backend (if applicable)- Make your changes and commit the changes.



# Testing**Use GitHub Codespaces**

npm run test            # Run test suites

npm run test:watch      # Run tests in watch mode- Navigate to the main page of your repository.

npm run test:coverage   # Generate coverage reports- Click on the "Code" button (green button) near the top right.

- Select the "Codespaces" tab.

# Code Quality- Click on "New codespace" to launch a new Codespace environment.

npm run lint            # ESLint checking- Edit files directly within the Codespace and commit and push your changes once you're done.

npm run lint:fix        # Auto-fix ESLint issues

npm run format          # Prettier formatting## What technologies are used for this project?

npm run type-check      # TypeScript type checking

This project is built with:

# Utilities

npm run setup           # Install all dependencies- Vite

npm run clean           # Clean node_modules and builds- TypeScript

npm run reset           # Reset project (clean + install)- React

```- shadcn-ui

- Tailwind CSS

### Project Structure

```## How can I deploy this project?

ca-flow-board/

├── 📁 src/                     # Frontend React ApplicationSimply open [Lovable](https://lovable.dev/projects/d12963e7-766e-4f25-88cf-533ff3a12ba4) and click on Share -> Publish.

│   ├── 📁 components/          # Reusable UI components

│   │   ├── 📁 auth/           # Authentication components## Can I connect a custom domain to my Lovable project?

│   │   ├── 📁 dashboard/      # Dashboard widgets

│   │   ├── 📁 forms/          # Form componentsYes, you can!

│   │   └── 📁 ui/             # Base UI components (ShadCN)

│   ├── 📁 pages/              # Page components & routingTo connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

│   │   ├── 📁 admin/          # Admin-specific pages

│   │   ├── 📁 client/         # Client portal pagesRead more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

│   │   └── 📁 employee/       # Employee dashboard pages
│   ├── 📁 services/           # API communication layer
│   ├── 📁 store/              # Redux state management
│   ├── 📁 hooks/              # Custom React hooks
│   └── 📁 lib/                # Utility functions
├── 📁 backend/                 # Node.js/Express Server
│   ├── 📁 models/             # MongoDB/Mongoose models
│   ├── 📁 routes/             # Express route handlers
│   ├── 📁 middleware/         # Custom middleware
│   ├── 📁 services/           # Business logic layer
│   ├── 📁 utils/              # Helper utilities
│   └── 📄 server.js           # Entry point
├── 📁 public/                  # Static assets
└── 📁 docs/                    # Documentation files
```

---

## 💳 Razorpay Payment Integration

### Setup Instructions
1. **Create Razorpay Account**
   - Visit [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Complete KYC verification
   - Generate API keys

2. **Configure API Keys**
   ```env
   # Test Mode
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx
   
   # Production Mode
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx
   ```

3. **Webhook Configuration**
   - **URL**: `https://yourdomain.com/api/payments/webhook`
   - **Events**: `payment.captured`, `payment.failed`, `order.paid`
   - **Secret**: Generate and add to environment variables

### Payment Features
- ✅ **Invoice Payments** - Direct payment links in invoices
- ✅ **Payment Verification** - Automatic payment status updates
- ✅ **GST Calculations** - Built-in Indian tax calculations
- ✅ **Payment History** - Complete transaction tracking
- ✅ **Refund Management** - Handle refunds and chargebacks
- ✅ **Multiple Methods** - Cards, UPI, Net Banking, Wallets

---

## 🔒 Security & Authentication

### Security Features
- **🔐 JWT Authentication** - Stateless, secure token-based auth
- **🛡️ Role-Based Access Control** - Granular permission system
- **🔒 Password Hashing** - bcrypt with salt rounds
- **⚡ Rate Limiting** - API endpoint protection
- **🚫 Input Validation** - SQL injection and XSS prevention
- **🌐 CORS Configuration** - Cross-origin request security

### User Roles & Permissions
| Role | Permissions |
|------|-------------|
| **Super Admin** | Full system access, manage all firms |
| **Admin** | Firm management, user creation, settings |
| **Owner** | Firm operations, employee management |
| **Employee** | Task management, client interaction |
| **Client** | View invoices, make payments, upload documents |

---

## 📊 API Documentation

### Authentication Endpoints
```http
POST   /api/auth/login          # User authentication
POST   /api/auth/register       # New user registration
POST   /api/auth/refresh        # Token refresh
GET    /api/auth/me             # Current user profile
POST   /api/auth/logout         # User logout
```

### Core Management APIs
```http
# User Management
GET    /api/users               # List users
POST   /api/users               # Create user
PUT    /api/users/:id           # Update user
DELETE /api/users/:id           # Delete user

# Client Management
GET    /api/clients             # List clients
POST   /api/clients             # Create client
PUT    /api/clients/:id         # Update client
GET    /api/clients/:id/documents # Client documents

# Task Management
GET    /api/tasks               # List tasks
POST   /api/tasks               # Create task
PUT    /api/tasks/:id           # Update task
POST   /api/tasks/:id/complete  # Mark complete

# Invoice Management
GET    /api/invoices            # List invoices
POST   /api/invoices            # Create invoice
PUT    /api/invoices/:id        # Update invoice
POST   /api/invoices/:id/send   # Send invoice
```

### Payment Processing APIs
```http
POST   /api/payments/create-order    # Create payment order
POST   /api/payments/verify          # Verify payment
POST   /api/payments/webhook         # Razorpay webhooks
GET    /api/payments/history         # Payment history
POST   /api/payments/refund          # Process refund
```

---

## 🚀 Deployment Guide

### Environment Setup (Production)
```env
# Production Backend Configuration
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ca-flow-board
JWT_SECRET=production-ultra-secure-secret-64-characters-minimum
RAZORPAY_KEY_ID=rzp_live_production_key
RAZORPAY_KEY_SECRET=production_secret_key

# Production Frontend Configuration
VITE_API_URL=https://api.yourdomain.com/api
VITE_RAZORPAY_KEY_ID=rzp_live_production_key
```

### Build & Deploy
```bash
# Build frontend for production
npm run build

# Backend deployment
cd backend
npm install --production
npm start

# Using PM2 (recommended)
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Platform-Specific Deployment

#### 🔷 Digital Ocean / AWS / GCP
```bash
# Install dependencies
sudo apt update
sudo apt install nodejs npm mongodb

# Clone and setup
git clone https://github.com/Rohith-sreedharan/ca-flow-board.git
cd ca-flow-board
npm run setup

# Configure environment and start
cp .env.example .env
# Edit environment variables
npm run build
cd backend && npm start
```

#### 🔶 Docker Deployment
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

---

## 🧪 Testing Strategy

### Testing Stack
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Supertest for API testing
- **E2E Tests**: Playwright for user workflows
- **Performance Tests**: Artillery for load testing

### Running Tests
```bash
# Run all tests
npm run test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

---

## 🤝 Contributing

We welcome contributions to CA Flow Board! Please follow our contribution guidelines:

### Development Process
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards
- Follow TypeScript best practices
- Use Prettier for code formatting
- Write meaningful commit messages
- Include tests for new features
- Update documentation as needed

### Pull Request Guidelines
- Provide clear description of changes
- Include screenshots for UI changes
- Ensure all tests pass
- Update relevant documentation
- Follow semantic versioning principles

---

## 📞 Support & Community

### Getting Help
- **📚 Documentation**: Comprehensive guides and API references
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/Rohith-sreedharan/ca-flow-board/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/Rohith-sreedharan/ca-flow-board/discussions)
- **📧 Email Support**: support@springgreen.in

### Community Resources
- **🎥 Video Tutorials**: YouTube channel with setup guides
- **📖 Blog Posts**: Best practices and feature announcements
- **🔄 Updates**: Follow releases for new features
- **💡 Feature Requests**: Submit ideas for improvements

---

## 📄 License & Legal

### License
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### Third-Party Acknowledgments
- React & React Ecosystem - UI Framework
- ShadCN UI - Component Library
- Razorpay - Payment Processing
- MongoDB - Database Platform
- Express.js - Server Framework

---

## 🎯 Roadmap & Future Features

### Q1 2025
- [ ] **Mobile App** - React Native iOS/Android apps
- [ ] **Advanced Analytics** - Machine learning insights
- [ ] **API Marketplace** - Third-party integrations
- [ ] **White-label Solution** - Custom branding options

### Q2 2025
- [ ] **Multi-language Support** - Internationalization
- [ ] **Advanced Automation** - AI-powered workflows
- [ ] **Blockchain Integration** - Document verification
- [ ] **Advanced Reporting** - Custom report builder

---

<div align="center">

### 🌟 **CA Flow Board** - Revolutionizing CA Practice Management

**[🚀 Get Started](https://github.com/Rohith-sreedharan/ca-flow-board)** • **[📖 Documentation](#)** • **[💬 Community](#)** • **[🎯 Roadmap](#)**

*Built with ❤️ for the CA community*

[![GitHub stars](https://img.shields.io/github/stars/Rohith-sreedharan/ca-flow-board?style=social)](https://github.com/Rohith-sreedharan/ca-flow-board/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Rohith-sreedharan/ca-flow-board?style=social)](https://github.com/Rohith-sreedharan/ca-flow-board/network/members)

</div>

## 🔧 Troubleshooting: Views API 404/500

- Symptom: "Not found - /api/views" or network calls going to `http://localhost:3001/api`.
- Fix: Ensure frontend points to the bundled backend on port 5000.
  - Copy `.env.example` to `.env` and keep `VITE_API_URL=http://localhost:5000/api`.
  - Remove or update any local `.env` overriding `VITE_API_URL` to `3001`.
  - Restart the frontend dev server after changes.
- Note: Some legacy hooks still hardcode 3001 for dev; they don't affect the Views feature, which uses the centralized `apiClient`.

## 🤖 AI Chatbox (Gemini) Setup

### What you get
- **Global floating AI chatbox** accessible from ANY authenticated page via a button at the bottom-right corner
- Message list, streaming responses, file attachments (images), privacy toggle, history, and clear
- Backend proxy forwards requests to Google Gemini and streams tokens back to the UI
- Auth required for all chat endpoints, plus per-route rate limits
- Available to all user roles: Super Admin, Admin, Owner, Employee, and Client

### Configure credentials
1) In `backend/.env` set:
```
GEMINI_API_KEY=your_google_generative_ai_key
# Optional. Defaults to gemini-1.5-pro-latest
GEMINI_MODEL=gemini-1.5-pro-latest
```
2) Restart the backend. You can verify configuration via:
```
GET /api/ai/status
```

### How data is provided to the model
Today the chat can answer using:
- Direct user prompt, optionally augmented with a small rolling chat history (last ~10 turns) if Privacy is OFF.

Planned approach for app data (indexing not part of this ticket):
- Embeddings + Retrieval: Periodically embed key entities (clients, tasks, invoices) and store vectors. At query time, retrieve top-k records and include them in the prompt context.
- Direct context: For specific features (e.g., summaries), the server composes a concise data overview (counts, totals, last updates) and injects it into the prompt.

Privacy toggle behavior:
- ON: messages are not persisted server-side; only local UI state is used.
- OFF: user and AI messages are stored in a dedicated "AI Assistant" chat room (per user) using existing `ChatRoom` and `ChatMessage` models.

### Endpoints
- `POST /api/ai/chat/stream` (recommended): Streams model output. Accepts JSON or `multipart/form-data` for image attachments.
   - Body (JSON): `{ prompt: string, privacy: boolean }`
   - Body (Form): `prompt`, `privacy`, `attachments[]` (images)
- `POST /api/ai/chat`: Non-streaming fallback. Accepts JSON only.
- `GET /api/ai/history`: Returns the stored chat history when Privacy is OFF.
- `DELETE /api/ai/history`: Clears stored history for the current user.
- `GET /api/ai/status`: Returns whether Gemini is configured.

### UI usage
- The AI chatbox is **globally accessible** on ALL authenticated pages
- Look for the floating bot button at the **bottom-right corner** of any page after login
- Click the bot button to open the AI chatbox
- Type a question and press Enter or click Send. Responses stream in real time
- Click the paperclip to attach images. Toggle Privacy as needed. Click Clear to reset
- Works for all roles: Owner, Admin, Employee, and Client

### Rate limits
- Global API rate limit applies.
- Additional AI-specific rate limit: 30 requests/min per IP (configurable in `backend/routes/ai.js`).

### Notes
- If you need to use a newer Gemini model (e.g., Gemini 2.x Pro), set `GEMINI_MODEL` accordingly once available in your region/account.
- For production, consider adding vector storage and retrieval (e.g., MongoDB Atlas Vector, pgvector, or a vector DB) to ground answers on firm data.
- See detailed documentation:
  - [AI Chatbox User Guide](docs/AI_CHATBOX_ACCESS.md)
  - [AI Chatbox Architecture](docs/AI_CHATBOX_ARCHITECTURE.md)
  - [Implementation Summary](docs/AI_CHATBOX_IMPLEMENTATION.md)
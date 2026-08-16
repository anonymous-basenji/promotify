# Promotify One 🚀

**Promotify One** is an enterprise-grade, team-collaborative social media promotion tracker built with **React Router v7 (SSR + TypeScript)**, **Express.js**, and **Supabase (PostgreSQL + Auth)**.

It empowers marketing teams, community organizers, and business owners to organize Facebook groups, manage promotional copy, schedule allowed posting days, and track multi-member post execution across dedicated workspaces.

---

## ✨ Key Features

- 🏢 **Multi-Tenant Team Workspaces & Permissions**:
  - Create and manage isolated team workspaces with role-based access control (`Owner`, `Admin`, `Member`).
  - Invite team members by email, manage roles, or remove members.
  - Dedicated workspace settings with danger zone controls (reset post counts, workspace deletion).

- 📅 **Day-by-Day Facebook Group Schedule Tracker**:
  - Filter groups by **Today**, specific days of the week (`Sunday`–`Saturday`), or view **All**.
  - Intelligent sorting: Restricted groups (custom rules/notes or day limits) automatically surface first.
  - Quick search and filtering for restricted-only schedules.

- ✍️ **Team Promo Copy Synchronization**:
  - Centralized promotional message editor per workspace with one-click copy to clipboard.
  - Real-time updates saved directly to the database.

- 📊 **Multi-Member Post Logging & History**:
  - One-tap **"Mark Posted"** and **"Post Again"** for multi-post tracking.
  - LIFO **Undo** to safely revert mistaken post logs.
  - Comprehensive **Group Post History Drawer** showing timestamps, dates, notes, and the teammate who posted.
  - Granular post count reset (reset per group or reset entire workspace).

- 🔐 **Authentication & Security**:
  - Powered by Supabase Auth supporting **Google OAuth** and **Email Magic Link** login.
  - Row-Level Security (RLS) and Express middleware verifying workspace membership on every API call.

- 📱 **Responsive Mobile-First UI**:
  - Dark glassmorphism aesthetic built with Vanilla CSS variables and micro-interactions.
  - Responsive header with full-width mobile hamburger menu.
  - Safe-area support for mobile web and native Capacitor containers.

---

## 🛠️ Architecture & Tech Stack

```
promotify/
├── backend/                  # Express + TypeScript API
│   ├── src/
│   │   ├── config/           # Supabase client configuration
│   │   ├── controllers/      # Route controllers (Auth, Team, Group, Post)
│   │   ├── middleware/       # Auth verification & error handling
│   │   ├── repositories/     # Data access layer (Supabase PostgreSQL)
│   │   ├── routes/           # REST API routes
│   │   ├── services/         # Business logic & permission verification
│   │   └── types/            # Backend TypeScript types & DTOs
├── frontend/                 # React Router v7 Fullstack App
│   ├── app/
│   │   ├── components/       # UI components & scoped styles
│   │   ├── context/          # Auth context & session provider
│   │   ├── lib/              # API fetch helpers & config
│   │   ├── routes/           # Page routes (Login, Teams, Team Dashboard)
│   │   └── types/            # Frontend TypeScript types
└── package.json              # Monorepo npm workspaces configuration
```

- **Frontend**: React Router v7, React 19, TypeScript, Lucide React, Vanilla CSS
- **Backend**: Node.js, Express.js, TypeScript, Supabase JS Client
- **Database & Auth**: Supabase (PostgreSQL with RLS + GoTrue Auth)
- **Container / Mobile**: Capacitor v6 (Android ready)

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 20+
- npm 10+
- Supabase Project (URL, Anon Key, Service Role Key)

### 2. Installation
```bash
git clone https://github.com/anonymous-basenji/promotify.git
cd promotify
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
# Frontend Supabase Public Config
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:4000

# Backend Config
PORT=4000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key
CLIENT_ORIGIN=http://localhost:3000
```

### 4. Database Setup
Run the SQL schema in your Supabase SQL Editor:
- Tables: `profiles`, `teams`, `team_members`, `facebook_groups`, `post_logs`.

### 5. Running Locally
Start both backend and frontend concurrently:
```bash
npm run dev
```
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000`

### 6. Type Checking & Production Build
```bash
npm run typecheck
npm run build
```

---

## 📄 License
MIT

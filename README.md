# MemoryVerse - Private Digital Memory-Sharing Platform

MemoryVerse is a private digital memory-sharing platform where administrators create and manage multiple private friendship groups. Each friendship group can securely access only its own memories using a unique **Memory ID** and **Password** and view them through dynamic 3D WebGL themes.

---

## 🚀 Features

1. **Visitor Landing Page (`/`)**:
   - Immersive 3D/WebGL experiences (Cinematic Space, Cherry Blossom, Galaxy Constellation, etc.).
   - Memory ID input field (e.g., `MV-8A73PQ`) and Password verification.
   - Secure validation and interactive 3D memory timeline.

2. **Admin Login Page (`/admin/login`)**:
   - Secure Administrator Login using Supabase Authentication.

3. **Admin Dashboard (`/admin/dashboard`)**:
   - Full CRUD for Groups, Photos, Videos, Quotes, and Final Messages.
   - **Drag and Drop Interface**: Easily reorder media items and quotes.
   - **Dynamic Customization**: Change themes, text colors, background colors, and ambient audio per group.

4. **Supabase Backend Architecture**:
   - PostgreSQL Database via Supabase with secure Row Level Security (RLS) policies.
   - Supabase Storage Buckets for seamless media hosting.
   - `backend/supabase-schema.sql` file provided for 1-click database deployment.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, React Router DOM, @tanstack/react-query
- **3D Engine**: React Three Fiber, React Three Drei, Three.js
- **Backend / Database**: Supabase (PostgreSQL, Auth, Storage)
- **Tooling**: Vite, ESLint

---

## 🚀 Setup & Local Development

1. **Clone the repository**
2. **Install Dependencies**
   ```bash
   npm install
   ```
3. **Supabase Configuration**
   - Create a project on Supabase.
   - Run the SQL script located in `backend/supabase-schema.sql` in the Supabase SQL Editor.
   - Copy `.env.example` to `.env` and provide your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. **Run the App Locally**
   ```bash
   npm run dev
   ```

---

## 🔐 Sample Testing Credentials (if using default SQL seeding)

### Visitor Group Credentials (Memory ID / Password):
- `MV-8A73PQ` / `friendship2026` (The Starlight Squad 2026)

### Administrator Portal Credentials:
- **Email**: `admin@memoryverse.com`
- **Password**: Setup via your own Supabase Auth dashboard.

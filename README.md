# Denta Cloud — Full-Stack Admin Panel

A modern, multi-branch dental clinic admin panel with a polished mint/navy UI, JWT authentication, a live dashboard, and full CRUD (list, view, add, edit, delete) for Branches, Doctors, Staff, Patients, Appointments, and Billing.

- Frontend: React + Vite, React Router, Axios
- Backend: Node.js + Express, MongoDB (Mongoose), JWT, bcrypt

## Project Structure

```
denta cloud/
  backend/                # Express + MongoDB API (port 1478)
  frontend/               # React + Vite app (port 5173)
  dental-admin-panel.html # original static mockup (design reference)
```

## Prerequisites

- Node.js 18+ (tested on v24)
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string

## 1. Backend setup

```bash
cd backend
npm install
# configure .env with your MongoDB URI and port
npm run seed     # creates the admin user + sample data
npm run dev      # starts API on http://localhost:<PORT>
```

`.env` keys:

```
PORT=1478
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/...   # or mongodb://127.0.0.1:27017/denta-cloud
JWT_SECRET=...
JWT_EXPIRES=7d
CLIENT_ORIGIN=http://localhost:5173

# AI Assistant — add GEMINI_API_KEY or OPENAI_API_KEY for ChatGPT/Gemini-style chat
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

## AI Assistant (optional)

The floating 🤖 button opens a conversational assistant (like ChatGPT/Gemini).

1. Add to `backend/.env`:
   - `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey), **or**
   - `OPENAI_API_KEY` from OpenAI
2. Restart the backend (`npm run dev`)
3. Open the assistant from the bottom-right icon on any page

Without an API key, a built-in smart assistant still works with follow-up questions and confirmations.

Notes:
- If you change `PORT`, update the proxy `target` in `frontend/vite.config.js` to match (currently `http://localhost:1478`).
- For `mongodb+srv://` (Atlas) URIs, the server automatically retries via public DNS (8.8.8.8 / 1.1.1.1) if your local resolver refuses the SRV lookup.

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev      # starts app on http://localhost:5173
```

Vite proxies all `/api` requests to the backend (port 1478).

## 3. Log in

Open http://localhost:5173. On the login page, pick a role (credentials are pre-filled) and sign in.
The **Dental Admin** role is selected by default and lands directly on the dashboard.

| Role         | Email                  | Password   |
|--------------|------------------------|------------|
| Dental Admin | admin@dentacloud.com   | admin123   |
| Doctor       | doctor@dentacloud.com  | doctor123  |
| Staff        | staff@dentacloud.com   | staff123   |

## Features

- Secure JWT login with role selection; protected routes.
- Live dashboard: animated stat cards, upcoming appointments, branch-wise revenue bars.
- Full CRUD for Branches, Doctors, Staff, Patients, Appointments, and Invoices.
- Reusable data table with search, status filtering, and pagination.
- Invoice builder with line items and auto-calculated subtotal/total/balance.
- Toast notifications, confirm dialogs, and a collapsible sidebar.

## API overview

All routes are under `/api` and (except `/auth/login`) require a `Bearer` token.

- `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/dashboard`
- `GET|POST /api/branches`, `GET|PUT|DELETE /api/branches/:id`
- `.../doctors`, `.../staff`, `.../patients`, `.../appointments`, `.../invoices` (same CRUD shape)

List endpoints support `?search=`, `?status=`, `?branch=`, `?page=`, `?limit=`.

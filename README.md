# Revanth Software Solutions Portal

Role-based software company management portal with three roles: Admin, Employee, and Client.

## Tech Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: Supabase PostgreSQL
- ORM: Prisma
- Auth: Access token in memory + refresh token in HttpOnly cookie

## Core Features Implemented
- Email/password authentication with role-based access
- Public registration with role selection (`ADMIN`, `EMPLOYEE`, `CLIENT`)
- Admin portal:
  - Create/remove employees
  - Create client companies
  - Create services
  - Approve service requests to create projects
  - Assign/unassign employees to projects
  - Manage projects and dashboard stats
  - Manage users
  - Message employees and clients
  - Edit profile
- Employee portal:
  - View assigned projects
  - Update project status
  - Message admin/client
  - Edit profile
  - Cannot self-unassign from project (server-enforced)
- Client portal:
  - View projects
  - Request new service
  - Message admin/assigned employees
  - Edit profile

## Project Structure
- `client/` React app
- `server/` Express API and Prisma

## Environment Setup

### Server (`server/.env`)
Copy from `server/.env.example` and set:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=YOUR_SUPABASE_POOLED_URL
DIRECT_URL=YOUR_SUPABASE_DIRECT_URL
JWT_ACCESS_SECRET=YOUR_32_PLUS_CHAR_SECRET
JWT_REFRESH_SECRET=YOUR_32_PLUS_CHAR_SECRET
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
COOKIE_SECURE=false
COOKIE_DOMAIN=
```

CORS allowed origins are configured in `server/src/config/cors.ts`.

### Client (`client/.env`)
Copy from `client/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Run Locally

### Install
- `cd server && npm install`
- `cd ../client && npm install`

### Prisma
- `cd server`
- `npx prisma generate`
- `npx prisma migrate dev --name init`

### Start
- Backend: `cd server && npm run dev`
- Frontend: `cd client && npm run dev`

## Deploy
- Frontend: Vercel
- Backend: Render
- Database: Supabase Postgres

Set matching environment variables in Render/Vercel dashboards.

## API Prefixes
- `/api/auth`
- `/api/admin`
- `/api/employee`
- `/api/client`
- `/api/messages`
- `/api/profile`

## Test Credentials

- Admin: ______________________
- Employee: ______________________
- Client: ______________________

## Further Information

For further information and a more detailed view of the project, please check the Notion page:
https://www.notion.so/manaagenda-30ee37631f6680628d50c1befbd67c03?source=copy_link


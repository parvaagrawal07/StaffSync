# StaffSync – Modern HR Management Solution (MERN)

Roles: **HR** (employees, leave approvals, attendance, announcements, training), **Manager** (team leave approvals, training), **Employee** (apply leave, mark attendance, view news, enroll in training).

## Prerequisites
Node.js v16+, npm v8+, MongoDB running locally (or a MongoDB Atlas URI in `server/.env`).

## Run
```bash
# Terminal 1 - backend
cd server
npm install
npm run seed      # creates demo users
npm run dev       # http://localhost:5000

# Terminal 2 - frontend
cd client
npm install
npm run dev       # http://localhost:5173
```
Demo logins (password `password123`): hr@staffsync.com, manager@staffsync.com, employee@staffsync.com

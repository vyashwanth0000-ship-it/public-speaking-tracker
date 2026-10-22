# Public Speaking Practice Tracker — MERN

A small MERN starter project with:
- React frontend (Vite)
- Node.js + Express API
- MongoDB + Mongoose
- JWT authentication with bcrypt password hashing
- Speech topic CRUD
- Practice session logging and progress summary

## Requirements
- Node.js (recent LTS)
- MongoDB Community Server running locally, OR a MongoDB Atlas URI

## 1. Configure backend
Open a terminal in `backend` and install dependencies:
```bash
npm install
```
Copy `.env.example` to `.env` and adjust values if needed:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/public_speaking_tracker
JWT_SECRET=replace_this_with_a_long_random_secret
```
Start backend:
```bash
npm run dev
```
Health check: http://localhost:5000/

## 2. Configure frontend
Open a second terminal in `frontend`:
```bash
npm install
npm run dev
```
Open the URL printed by Vite, usually http://localhost:5173.

## Notes
- Backend and frontend run in separate terminals.
- Keep MongoDB running.
- This is a college-project starter, not a production-hardened application.
- If you already have another server using port 5000, stop that process or change PORT in `.env`.

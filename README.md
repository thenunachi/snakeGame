# Snake Game

Full-stack Snake game with React frontend and Python (FastAPI) backend.

## Features
- 3 difficulty levels: Easy, Medium, Hard
- Login/Register with JWT auth
- Score tracking per player and level
- Global leaderboard
- Multiple concurrent players supported

## Local Development

### Backend (Python)
```bash
cd api
pip install -r requirements.txt
python run.py
# Server starts at http://localhost:8000
```

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
# App starts at http://localhost:5173
# API calls are proxied to http://localhost:8000
```

## Deploy to Vercel

### 1. Set up a database
Create a free database on [Supabase](https://supabase.com) or [Neon](https://neon.tech).
Copy the connection string (PostgreSQL URL).

### 2. Push to GitHub
```bash
git add .
git commit -m "Initial snake game"
git push origin main
```

### 3. Import to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Set **Root Directory** to `snakeGame`
4. Add environment variables:
   - `DATABASE_URL` = your PostgreSQL connection string
   - `SECRET_KEY` = a random secret (generate with `python -c "import secrets; print(secrets.token_hex(32))"`)

### 4. Initialize database tables
After first deploy, run the SQL in your database console:
```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    score INTEGER NOT NULL,
    level TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Game Controls
- **Arrow Keys** or **WASD** to move
- **Space** or **Enter** to start/restart
- **Click** the canvas to start

## Level Config
| Level  | Speed   | Max Fruits | Fruit Spawn |
|--------|---------|------------|-------------|
| Easy   | 200ms   | 1          | Every 8s    |
| Medium | 130ms   | 2          | Every 4s    |
| Hard   | 70ms    | 3          | Every 2s    |

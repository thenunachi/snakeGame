import os
import sqlite3
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import bcrypt
from jose import JWTError, jwt

# ── Config ─────────────────────────────────────────────────────────────────
SECRET_KEY = os.environ.get("SECRET_KEY", "super-secret-snake-key-change-me")
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Use Postgres in production (set DATABASE_URL), SQLite locally
DATABASE_URL = os.environ.get("DATABASE_URL", "")
USE_POSTGRES = bool(DATABASE_URL)

if USE_POSTGRES:
    import psycopg2
    import psycopg2.extras
    # Supabase / Heroku use postgres:// — psycopg2 needs postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    # Supabase requires SSL — append if not already present
    if "sslmode" not in DATABASE_URL:
        DATABASE_URL += "?sslmode=require"

DB_PATH = "/tmp/snake_game.db"

security = HTTPBearer()

# ── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(title="Snake Game API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Database ────────────────────────────────────────────────────────────────
def get_db():
    if USE_POSTGRES:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they don't exist. Skipped silently on failure (e.g. Supabase RLS)."""
    try:
        conn = get_db()
        cur = conn.cursor()
        if USE_POSTGRES:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS scores (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    username TEXT NOT NULL,
                    score INTEGER NOT NULL,
                    level TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        else:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS scores (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    username TEXT NOT NULL,
                    score INTEGER NOT NULL,
                    level TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        conn.commit()
        conn.close()
    except Exception:
        pass  # Tables already exist or managed externally (Supabase)


init_db()

# ── Auth utils ──────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_token(user_id: int, username: str) -> str:
    exp = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "username": username, "exp": exp}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return {"id": int(payload["sub"]), "username": payload["username"]}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def db_fetchone(conn, sql, params=()):
    cur = conn.cursor()
    cur.execute(sql, params)
    row = cur.fetchone()
    return dict(row) if row else None


def db_fetchall(conn, sql, params=()):
    cur = conn.cursor()
    cur.execute(sql, params)
    return [dict(r) for r in cur.fetchall()]


def db_execute(conn, sql, params=()):
    cur = conn.cursor()
    cur.execute(sql, params)
    conn.commit()
    return cur

# ── Schemas ─────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class ScoreRequest(BaseModel):
    score: int
    level: str  # easy | medium | hard

# ── Routes ──────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        conn.close()
        return {"status": "ok", "db": "connected", "postgres": USE_POSTGRES}
    except Exception as e:
        return {"status": "ok", "db": "error", "detail": str(e)}


@app.post("/api/auth/register")
def register(req: RegisterRequest):
    if len(req.username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    conn = get_db()
    try:
        if USE_POSTGRES:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
                (req.username, req.email, hash_password(req.password))
            )
            user_id = cur.fetchone()["id"]
        else:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
                (req.username, req.email, hash_password(req.password))
            )
            user_id = cur.lastrowid
        conn.commit()
        token = create_token(user_id, req.username)
        return {"token": token, "username": req.username}
    except Exception as e:
        conn.rollback()
        err = str(e).lower()
        if "unique" in err or "duplicate" in err:
            raise HTTPException(status_code=400, detail="Username or email already exists")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
    finally:
        conn.close()


@app.post("/api/auth/login")
def login(req: LoginRequest):
    conn = get_db()
    try:
        if USE_POSTGRES:
            row = db_fetchone(conn, "SELECT * FROM users WHERE username = %s", (req.username,))
        else:
            row = db_fetchone(conn, "SELECT * FROM users WHERE username = ?", (req.username,))
    finally:
        conn.close()

    if not row or not verify_password(req.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_token(row["id"], row["username"])
    return {"token": token, "username": row["username"]}


@app.get("/api/auth/me")
def me(current_user: dict = Depends(get_current_user)):
    return current_user


@app.post("/api/scores")
def save_score(req: ScoreRequest, current_user: dict = Depends(get_current_user)):
    if req.level not in ("easy", "medium", "hard"):
        raise HTTPException(status_code=400, detail="Invalid level")
    conn = get_db()
    try:
        if USE_POSTGRES:
            db_execute(conn,
                "INSERT INTO scores (user_id, username, score, level) VALUES (%s, %s, %s, %s)",
                (current_user["id"], current_user["username"], req.score, req.level)
            )
        else:
            db_execute(conn,
                "INSERT INTO scores (user_id, username, score, level) VALUES (?, ?, ?, ?)",
                (current_user["id"], current_user["username"], req.score, req.level)
            )
    finally:
        conn.close()
    return {"message": "Score saved"}


@app.get("/api/scores/me")
def my_scores(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    try:
        if USE_POSTGRES:
            rows = db_fetchall(conn, """
                SELECT level, MAX(score) AS best_score, COUNT(*) AS games_played,
                       MIN(created_at) AS first_played
                FROM scores WHERE user_id = %s
                GROUP BY level
                ORDER BY CASE level WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 WHEN 'hard' THEN 3 END
            """, (current_user["id"],))
        else:
            rows = db_fetchall(conn, """
                SELECT level, MAX(score) AS best_score, COUNT(*) AS games_played,
                       MIN(created_at) AS first_played
                FROM scores WHERE user_id = ?
                GROUP BY level
                ORDER BY CASE level WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 WHEN 'hard' THEN 3 END
            """, (current_user["id"],))
    finally:
        conn.close()
    return rows


@app.get("/api/scores/history")
def score_history(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    try:
        if USE_POSTGRES:
            rows = db_fetchall(conn,
                "SELECT score, level, created_at FROM scores WHERE user_id = %s ORDER BY created_at DESC LIMIT 20",
                (current_user["id"],)
            )
        else:
            rows = db_fetchall(conn,
                "SELECT score, level, created_at FROM scores WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
                (current_user["id"],)
            )
    finally:
        conn.close()
    return rows


@app.get("/api/leaderboard")
def leaderboard():
    conn = get_db()
    try:
        rows = db_fetchall(conn, """
            SELECT username, level, MAX(score) AS best_score
            FROM scores
            GROUP BY username, level
            ORDER BY best_score DESC
            LIMIT 30
        """)
    finally:
        conn.close()
    return rows



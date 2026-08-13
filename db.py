import os
import sqlite3
import json

class Database:
    def __init__(self, db_dir="backend/data", db_name="users.db"):
        self.db_dir = os.path.abspath(db_dir)
        os.makedirs(self.db_dir, exist_ok=True)
        self.db_path = os.path.join(self.db_dir, db_name)
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            # Automatic schema migration: if table exists without email column, drop it
            try:
                cursor = conn.execute("PRAGMA table_info(users)")
                columns = [row[1] for row in cursor.fetchall()]
                if columns and "email" not in columns:
                    print("Outdated database schema detected. Re-creating users table to support email field...")
                    conn.execute("DROP TABLE users")
            except Exception as e:
                print(f"Error checking schema: {e}")
                
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    embedding TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()

    def register_user(self, username: str, email: str, embedding: list) -> bool:
        """
        Registers a new user with their username (name), email, and face embedding.
        Returns True if successful, False if email already exists.
        """
        embedding_str = json.dumps(embedding)
        try:
            with self._get_connection() as conn:
                conn.execute(
                    "INSERT INTO users (username, email, embedding) VALUES (?, ?, ?)",
                    (username.strip(), email.strip().lower(), embedding_str)
                )
                conn.commit()
            return True
        except sqlite3.IntegrityError:
            # Email already exists
            return False

    def get_user(self, email: str):
        """
        Retrieves a user profile by email.
        """
        with self._get_connection() as conn:
            cursor = conn.execute(
                "SELECT username, email, embedding, created_at FROM users WHERE email = ?",
                (email.strip().lower(),)
            )
            row = cursor.fetchone()
            if row:
                return {
                    "username": row["username"],
                    "email": row["email"],
                    "embedding": json.loads(row["embedding"]),
                    "created_at": row["created_at"]
                }
            return None

    def get_all_users(self):
        """
        Retrieves all registered users.
        """
        with self._get_connection() as conn:
            cursor = conn.execute("SELECT username, email, embedding, created_at FROM users")
            rows = cursor.fetchall()
            users = []
            for row in rows:
                users.append({
                    "username": row["username"],
                    "email": row["email"],
                    "embedding": json.loads(row["embedding"]),
                    "created_at": row["created_at"]
                })
            return users

    def delete_user(self, email: str) -> bool:
        """
        Deletes a user by email.
        """
        with self._get_connection() as conn:
            cursor = conn.execute(
                "DELETE FROM users WHERE email = ?",
                (email.strip().lower(),)
            )
            conn.commit()
            return cursor.rowcount > 0

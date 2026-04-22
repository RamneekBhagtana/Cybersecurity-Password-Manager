# Cybersecurity Password Manager - CSC190

A cross-platform cybersecurity password manager with web and mobile applications.  
This backend is built using **Flask**, **PostgreSQL**, and **Flask-SQLAlchemy**.

---

## Prerequisites

Before running this project, make sure you have installed:

- Python 3.x  
- PostgreSQL (local installation)  
- pgAdmin 4 (optional, for GUI database management)

---

## Project Setup

1. **Clone the Repository**

```bash
git clone <your-repo-url>
cd flask

2. **Create and Activate a Virtual Environment**

python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Mac/Linux

3. **Install Dependencies**

pip install -r requirements.txt

---

## Database Setup

4. **Create PostgreSQL Database**

Using pgAdmin or psql:

CREATE DATABASE pm_db;
CREATE USER pm_user WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE pm_db TO pm_user;

5. **Configure Environment Variables**

Create a .env file in the project root:

DATABASE_URL=postgresql://pm_user:password123@localhost:5432/pm_db

6. **Initialize Database Migrations**

flask db init
flask db migrate -m "Initial schema"
flask db upgrade

This will create all tables based on the SQLAlchemy models.

---

## Running the Application

Start the Flask server:

python app.py

Open in your browser: http://127.0.0.1:5000/

---

## Testing Database Connection

Visit:

http://127.0.0.1:5000/test-tables

Expected output:

{
  "users": 0,
  "vault_entries": 0
}
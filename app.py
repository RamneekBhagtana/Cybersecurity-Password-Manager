from flask import Flask
import os
from dotenv import load_dotenv

from extensions import db, migrate  

load_dotenv()

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
migrate.init_app(app, db)

from models import User, VaultEntry, Tag, VaultEntryTag

@app.route('/')
def home():
    return "Flask is connected to the database!"

@app.route('/test-tables')
def test_tables():
    try:
        return {
            "users": User.query.count(),
            "vault_entries": VaultEntry.query.count()
        }
    except Exception as e:
        return {"error": str(e)}

@app.route('/test-tags')
def test_tags():
    try:
        user = User.query.first()
        if not user:
            user = User(id="test-user", email="test@test.com", salt="abc")
            db.session.add(user)
            db.session.commit()

        entry = VaultEntry(
            user_id=user.id,
            title="Test Site",
            password="encrypted",
            iv="iv",
            auth_tag="auth"
        )
        db.session.add(entry)

        tag = Tag(user_id=user.id, name="school")
        db.session.add(tag)
        db.session.commit()

        link = VaultEntryTag(
            vault_entry_id=entry.id,
            tag_id=tag.id
        )
        db.session.add(link)
        db.session.commit()

        results = db.session.query(VaultEntry).join(VaultEntryTag).filter(
            VaultEntryTag.tag_id == tag.id
        ).all()

        return {
            "status": "success",
            "entries_found": len(results)
        }

    except Exception as e:
        return {"error": str(e)}

if __name__ == '__main__':
    app.run(debug=True)
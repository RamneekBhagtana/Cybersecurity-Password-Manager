import sys, os
sys.path.insert(0, os.path.dirname(os.path.join(os.path.dirname(__file__))))

import pytest
from app import create_app

@pytest.fixture
def app():
    app - create_app()
    app.config["TESTING"] = True
    app.config[SQLALCHEMY_DATABASE_URI] = "sqlite:///:memory:"  # Use in-memory SQLite for tests
    return app
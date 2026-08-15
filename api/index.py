import sys
import os

# Add backend directory to sys.path so app modules and routers resolve cleanly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.main import app, handler

# Export for Vercel Serverless Functions
app = app
handler = handler
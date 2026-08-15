import sys
import os

# Set root project path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# Import using full package hierarchy so Pylance and Vercel resolve accurately
from backend.app.main import app, handler

# Export for Vercel Serverless
app = app
handler = handler
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_apscheduler import APScheduler
from flask_mail import Mail
from config import Config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config.from_object(Config)

db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)
mail = Mail(app)

# Initialize scheduler
scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()

logger.info("APScheduler initialized and started.")

# Import routes and tasks to ensure they're registered
from . import routes, models, tasks

if __name__ == '__main__':
    app.run()

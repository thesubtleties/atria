# .flaskenv - simpler version
FLASK_ENV=development
FLASK_APP=api.wsgi:app
SECRET_KEY=dkjfkldjlkjk
SQLALCHEMY_DATABASE_URI=postgresql://user:password@db:5432/atria
# Remove Celery stuff until you need it

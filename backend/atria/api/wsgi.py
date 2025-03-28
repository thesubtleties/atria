from api.app import create_app
from api.extensions import socketio

app = create_app()

if __name__ == "__main__":
    socketio.run(app)

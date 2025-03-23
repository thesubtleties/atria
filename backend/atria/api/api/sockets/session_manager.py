# api/sockets/session_manager.py
from datetime import datetime, timedelta
import functools
from flask import request
from flask_socketio import emit, disconnect


class SessionManager:
    def __init__(self):
        self.sessions = {}  # {sid: {'user_id': id, 'last_active': timestamp}}

    def authenticate(self, sid, user_id):
        """Authenticate a session"""
        self.sessions[sid] = {
            "user_id": user_id,
            "last_active": datetime.now(),
        }
        print(f"Authenticated session {sid} for user {user_id}")

    def is_authenticated(self, sid):
        """Check if a session is authenticated"""
        return sid in self.sessions

    def get_user_id(self, sid):
        """Get user ID for a session"""
        if sid in self.sessions:
            return int(self.sessions[sid]["user_id"])
        return None

    def update_activity(self, sid):
        """Update last activity timestamp"""
        if sid in self.sessions:
            self.sessions[sid]["last_active"] = datetime.now()

    def remove_session(self, sid):
        """Remove a session"""
        if sid in self.sessions:
            print(f"Removing session {sid}")
            del self.sessions[sid]

    def cleanup_inactive(self, timeout_hours=24):
        """Remove inactive sessions"""
        now = datetime.now()
        timeout = timedelta(hours=timeout_hours)

        inactive = [
            sid
            for sid, data in self.sessions.items()
            if now - data["last_active"] > timeout
        ]

        for sid in inactive:
            print(f"Cleaning up inactive session {sid}")
            self.remove_session(sid)

        return len(inactive)


# Create a singleton instance
session_manager = SessionManager()


# Authentication decorator factory
def authenticated_only(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if not session_manager.is_authenticated(request.sid):
            print(f"Unauthenticated event from {request.sid}")
            emit("auth_required", {"message": "Authentication required"})
            return

        # Update last activity time
        session_manager.update_activity(request.sid)

        # Add user_id to the function call
        user_id = int(session_manager.get_user_id(request.sid))
        return f(user_id, *args, **kwargs)

    return wrapped

from flask import Flask
from flask_cors import CORS
import os
from api import api

# from api import manage # this has been unused for a while
from api.extensions import smorest_api
from api.extensions import db
from api.extensions import jwt
from api.extensions import migrate
from api.extensions import socketio

# from api.extensions import CustomJSONProvider
from api.models import TokenBlocklist


def create_app(testing=False):
    """Application factory, used to create application"""
    app = Flask("api")
    # app.json_provider_class = CustomJSONProvider # Commented out because I think we fixed serialization problems
    app.config.from_object("api.config")

    # Use environment variable or function parameter for TESTING config
    if testing is True or os.getenv("FLASK_TESTING", "false").lower() == "true":
        app.config["TESTING"] = True

    configure_extensions(app)
    # configure_cli(app) #! removed because it is not used
    # configure_apispec(app)  #! will remove once smorest is working
    configure_smorest(app)
    # register_blueprints(app) #! turned off to use only new routes

    return app


def configure_extensions(app):
    """Configure flask extensions"""
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # Configure CORS based on environment
    flask_env = os.getenv("FLASK_ENV", "production")
    if flask_env == "development":
        # Development: Allow localhost origins with credentials
        CORS(
            app,
            origins=[
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:8080",
            ],
            supports_credentials=True,
            methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            allow_headers=["Content-Type", "Authorization"],
        )
        socketio.init_app(
            app,
            cors_allowed_origins=[
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:8080",
            ],
        )
    else:
        # Production: Only allow production domain with credentials
        CORS(
            app,
            origins=["https://atria.gg", "https://www.atria.gg"],
            supports_credentials=True,
            methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            allow_headers=["Content-Type", "Authorization"],
        )
        socketio.init_app(
            app,
            cors_allowed_origins=[
                "https://atria.gg",
                "https://www.atria.gg",
            ],
        )

    from api.api.sockets import register_socket_handlers

    register_socket_handlers()
    from api.api.sockets import setup_socket_maintenance

    setup_socket_maintenance()
    configure_jwt_handlers(app)


def configure_smorest(app):
    """Configure Flask-SMOREST for OpenAPI documentation"""
    # app.json_provider_class = CustomJSONProvider # Commented out because I think we fixed serialization problems
    smorest_api.init_app(app)
    from api.api.routes import register_blueprints

    register_blueprints(smorest_api)


# below is unused and will be removed in a future update
# def configure_cli(app):
#     """Configure Flask 2.0's cli for easy entity management"""
#     app.cli.add_command(manage.init)


def configure_apispec(app):
    """Configure APISpec for swagger support"""
    apispec.init_app(app, security=[{"jwt": []}])
    apispec.spec.components.security_scheme(
        "jwt", {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}
    )
    apispec.spec.components.schema(
        "PaginatedResult",
        {
            "properties": {
                "total": {"type": "integer"},
                "pages": {"type": "integer"},
                "next": {"type": "string"},
                "prev": {"type": "string"},
            }
        },
    )


def register_blueprints(app):
    """Register all blueprints for application"""
    # Now only registering the api blueprint which contains all resources
    app.register_blueprint(api.views.blueprint)


def configure_jwt_handlers(app):
    """Configure JWT error handlers and callbacks"""

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        token = TokenBlocklist.query.filter_by(jti=jti).first()
        return token is not None and token.revoked

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {"message": "Invalid token"}, 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {"message": "Token has expired"}, 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return {"message": "Token has been revoked"}, 401

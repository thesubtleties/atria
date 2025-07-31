# unused file will be removed in a future update
import click
from flask.cli import with_appcontext


@click.command("init")
@with_appcontext
def init():
    """Create a new admin user"""
    from api.extensions import db
    from api.models import User

    click.echo("create user")
    user = User(
        username="admin",
        email="steven@sbtl.ai",
        password="password",
        active=True,
    )
    db.session.add(user)
    db.session.commit()
    click.echo("created user admin")

from api.models import Session
from api.extensions import ma


class SessionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Session
        sqla_session = db.session
        load_instance = True
        include_fk = True

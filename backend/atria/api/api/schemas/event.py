from api.models import Event
from api.extensions import ma


class EventSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Event
        sqla_session = db.session
        load_instance = True
        include_fk = True

# api/api/schemas/connection.py
from api.extensions import ma, db
from api.models import Connection
from api.models.enums import ConnectionStatus


class ConnectionSchema(ma.SQLAlchemyAutoSchema):
    """Base Connection Schema"""

    class Meta:
        model = Connection
        sqla_session = db.session
        include_fk = True
        name = "ConnectionBase"

    requester = ma.Nested(
        "UserSchema",
        only=(
            "id",
            "full_name",
            "email",
            "image_url",
            "company_name",
            "title",
        ),
        dump_only=True,
    )
    recipient = ma.Nested(
        "UserSchema",
        only=(
            "id",
            "full_name",
            "email",
            "image_url",
            "company_name",
            "title",
        ),
        dump_only=True,
    )
    originating_event = ma.Nested(
        "EventSchema",
        only=("id", "title"),
        dump_only=True,
    )


class ConnectionCreateSchema(ma.Schema):
    """Schema for creating connection requests"""

    class Meta:
        name = "ConnectionCreate"

    recipient_id = ma.Integer(required=True)
    icebreaker_message = ma.String(required=True)
    originating_event_id = ma.Integer()


class ConnectionUpdateSchema(ma.Schema):
    """Schema for updating connection status"""

    class Meta:
        name = "ConnectionUpdate"

    status = ma.Enum(ConnectionStatus, required=True)

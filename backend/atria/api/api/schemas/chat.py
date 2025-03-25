# api/api/schemas/chat.py
from api.extensions import ma, db
from api.models import ChatRoom, ChatMessage


class ChatRoomSchema(ma.SQLAlchemyAutoSchema):
    """Base ChatRoom Schema"""

    class Meta:
        model = ChatRoom
        sqla_session = db.session
        include_fk = True
        name = "ChatRoomBase"


class ChatRoomDetailSchema(ChatRoomSchema):
    """Detailed ChatRoom Schema with relationships"""

    class Meta(ChatRoomSchema.Meta):
        name = "ChatRoomDetail"

    event = ma.Nested("EventSchema", only=("id", "title"), dump_only=True)


class ChatRoomCreateSchema(ma.Schema):
    """Schema for creating chat rooms"""

    class Meta:
        name = "ChatRoomCreate"

    name = ma.String(required=True)
    description = ma.String()
    is_global = ma.Boolean(default=False)


class ChatMessageSchema(ma.SQLAlchemyAutoSchema):
    """Base ChatMessage Schema"""

    class Meta:
        model = ChatMessage
        sqla_session = db.session
        include_fk = True
        name = "ChatMessageBase"

    user = ma.Nested(
        "UserSchema",
        only=("id", "full_name", "image_url"),
        dump_only=True,
    )


class ChatMessageCreateSchema(ma.Schema):
    """Schema for creating chat messages"""

    class Meta:
        name = "ChatMessageCreate"

    content = ma.String(required=True)

# api/api/schemas/direct_message.py
from api.extensions import ma, db
from api.models import DirectMessageThread, DirectMessage
from api.models.enums import MessageStatus
from flask_jwt_extended import get_jwt_identity


class DirectMessageThreadSchema(ma.SQLAlchemyAutoSchema):
    """Base DirectMessageThread Schema"""

    class Meta:
        model = DirectMessageThread
        sqla_session = db.session
        include_fk = True
        name = "DirectMessageThreadBase"

    user1 = ma.Nested(
        "UserSchema",
        only=("id", "full_name", "email", "image_url"),
        dump_only=True,
    )
    user2 = ma.Nested(
        "UserSchema",
        only=("id", "full_name", "email", "image_url"),
        dump_only=True,
    )

    # Add computed properties
    last_message = ma.Method("get_last_message")
    unread_count = ma.Method("get_unread_count")
    other_user = ma.Method("get_other_user")

    def get_last_message(self, obj):
        message = (
            DirectMessage.query.filter_by(thread_id=obj.id)
            .order_by(DirectMessage.created_at.desc())
            .first()
        )
        if message:
            return {
                "id": message.id,
                "content": message.content,
                "sender_id": message.sender_id,
                "created_at": message.created_at.isoformat(),
                "status": message.status.value if message.status else None,
            }
        return None

    def get_unread_count(self, obj):
        user_id = int(get_jwt_identity())
        return (
            DirectMessage.query.filter_by(
                thread_id=obj.id, status=MessageStatus.DELIVERED
            )
            .filter(DirectMessage.sender_id != user_id)
            .count()
        )

    def get_other_user(self, obj):
        user_id = int(get_jwt_identity())
        other_id = obj.user2_id if obj.user1_id == user_id else obj.user1_id
        from api.models import User

        other_user = User.query.get(other_id)
        if other_user:
            return {
                "id": other_user.id,
                "full_name": other_user.full_name,
                "image_url": other_user.image_url,
            }
        return None


class DirectMessageSchema(ma.SQLAlchemyAutoSchema):
    """Base DirectMessage Schema"""

    class Meta:
        model = DirectMessage
        sqla_session = db.session
        include_fk = True
        name = "DirectMessageBase"

    sender = ma.Nested(
        "UserSchema",
        only=("id", "full_name", "email", "image_url"),
        dump_only=True,
    )


class DirectMessageCreateSchema(ma.Schema):
    """Schema for creating direct messages"""

    class Meta:
        name = "DirectMessageCreate"

    content = ma.String(required=True)
    encrypted_content = ma.String()


class DirectMessageThreadCreateSchema(ma.Schema):
    """Schema for creating direct message threads"""

    class Meta:
        name = "DirectMessageThreadCreate"

    user_id = ma.Integer(required=True)
    event_id = ma.Integer(required=False, allow_none=True)

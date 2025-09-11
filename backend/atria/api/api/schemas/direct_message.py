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
    
    # Optional event-specific fields (added by service when event_id provided)
    # These are transient attributes set by the service layer
    shared_event_ids = ma.List(ma.Integer(), dump_only=True, required=False)
    other_user_in_event = ma.Boolean(dump_only=True, required=False)

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


# Response schemas for the enriched messages endpoint
# TODO: Consider moving these to a common schemas file if reused elsewhere

class MessagePaginationSchema(ma.Schema):
    """Pagination metadata for message responses
    Note: This is simpler than commons pagination (no links)"""
    
    class Meta:
        name = "MessagePagination"
    
    page = ma.Integer(dump_only=True)
    per_page = ma.Integer(dump_only=True)
    total = ma.Integer(dump_only=True)
    total_pages = ma.Integer(dump_only=True)


class ThreadUserSchema(ma.Schema):
    """Minimal user info for thread context
    TODO: Could be moved to user.py as SimpleUserSchema if reused"""
    
    class Meta:
        name = "ThreadUser"
    
    id = ma.Integer(dump_only=True)
    full_name = ma.String(dump_only=True)
    image_url = ma.String(dump_only=True, allow_none=True)


class FormattedMessageSchema(ma.Schema):
    """Schema for already-formatted message dictionaries from service layer"""
    
    class Meta:
        name = "FormattedMessage"
    
    id = ma.Integer(dump_only=True)
    thread_id = ma.Integer(dump_only=True)
    sender_id = ma.Integer(dump_only=True)
    sender = ma.Dict(dump_only=True)  # Already formatted as dict with id, full_name, image_url
    content = ma.String(dump_only=True)
    encrypted_content = ma.String(dump_only=True, allow_none=True)
    status = ma.String(dump_only=True)
    created_at = ma.String(dump_only=True)  # Already formatted as ISO string


class DirectMessagesWithContextSchema(ma.Schema):
    """Response schema for GET /direct-messages/threads/<id>/messages
    Includes messages, pagination, and thread context (other_user, encryption status)"""
    
    class Meta:
        name = "DirectMessagesWithContext"
    
    thread_id = ma.Integer(dump_only=True, required=True)
    messages = ma.List(ma.Nested(FormattedMessageSchema), dump_only=True, required=True)
    pagination = ma.Nested(MessagePaginationSchema, dump_only=True, required=True)
    other_user = ma.Nested(ThreadUserSchema, dump_only=True, required=True)
    is_encrypted = ma.Boolean(dump_only=True, required=True)

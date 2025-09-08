from datetime import datetime
from api.extensions import db
from api.models import (
    Connection,
    User,
    Event,
    EventUser,
    DirectMessageThread,
    DirectMessage,
)
from api.models.enums import ConnectionStatus, MessageStatus
from api.commons.pagination import paginate


class ConnectionService:
    @staticmethod
    def get_user_connections(user_id, status=None, schema=None):
        """Get connections for a user with optional status filter and privacy filtering"""
        from api.services.privacy import PrivacyService
        from api.models import User
        
        # Build query for connections where user is either requester or recipient
        query = Connection.query.filter(
            (Connection.requester_id == user_id)
            | (Connection.recipient_id == user_id)
        )

        # Filter by status if provided
        if status:
            query = query.filter_by(status=status)

        # Order by created_at descending
        query = query.order_by(Connection.created_at.desc())

        if schema:
            # Get paginated results first
            from api.commons.pagination import extract_pagination
            from flask import url_for, request
            
            page, per_page, other_request_args = extract_pagination(**request.args)
            page_obj = query.paginate(page=page, per_page=per_page)
            
            # Apply privacy filtering to each connection's users
            viewer = User.query.get(user_id)
            for connection in page_obj.items:
                # Apply privacy filtering to requester
                ConnectionService._apply_user_privacy_filtering(
                    connection, 'requester', viewer
                )
                # Apply privacy filtering to recipient
                ConnectionService._apply_user_privacy_filtering(
                    connection, 'recipient', viewer
                )
            
            # Generate pagination response
            endpoint = request.endpoint
            view_args = request.view_args or {}
            
            links = {
                "self": url_for(endpoint, page=page_obj.page, per_page=per_page, **other_request_args, **view_args),
                "first": url_for(endpoint, page=1, per_page=per_page, **other_request_args, **view_args),
                "last": url_for(endpoint, page=page_obj.pages, per_page=per_page, **other_request_args, **view_args),
            }
            
            if page_obj.has_next:
                links["next"] = url_for(endpoint, page=page_obj.next_num, per_page=per_page, **other_request_args, **view_args)
            
            if page_obj.has_prev:
                links["prev"] = url_for(endpoint, page=page_obj.prev_num, per_page=per_page, **other_request_args, **view_args)
            
            return {
                "total_items": page_obj.total,
                "total_pages": page_obj.pages,
                "current_page": page_obj.page,
                "per_page": per_page,
                **links,
                "connections": schema.dump(page_obj.items),
            }

        # For non-paginated results
        connections = query.all()
        viewer = User.query.get(user_id)
        for connection in connections:
            ConnectionService._apply_user_privacy_filtering(
                connection, 'requester', viewer
            )
            ConnectionService._apply_user_privacy_filtering(
                connection, 'recipient', viewer
            )
        return connections

    @staticmethod
    def get_pending_requests(user_id, schema=None):
        """Get pending connection requests received by a user with privacy filtering"""
        from api.models import User
        
        query = Connection.query.filter_by(
            recipient_id=user_id, status=ConnectionStatus.PENDING
        ).order_by(Connection.created_at.desc())

        if schema:
            # Get all connections first to apply privacy filtering
            connections = query.all()
            
            # Apply privacy filtering to each connection's requester
            viewer = User.query.get(user_id)
            for connection in connections:
                # Apply privacy filtering to requester WITH EVENT CONTEXT
                # Pending requests always have an originating event
                ConnectionService._apply_user_privacy_filtering_with_event(
                    connection, 'requester', viewer, connection.originating_event_id
                )
            
            # Now paginate with the filtered data
            from api.commons.pagination import paginate
            # Note: paginate expects a query, but we have a list now
            # So we'll manually construct the pagination response
            from flask import request
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 50))
            
            # Calculate pagination
            total = len(connections)
            start = (page - 1) * per_page
            end = start + per_page
            items = connections[start:end]
            
            return {
                "total_items": total,
                "total_pages": (total + per_page - 1) // per_page,
                "current_page": page,
                "per_page": per_page,
                "connections": schema.dump(items),
            }

        return query.all()

    @staticmethod
    def create_connection_request(
        requester_id,
        recipient_id,
        icebreaker_message,
        originating_event_id=None,
    ):
        """Create a new connection request"""
        # Check if recipient exists
        recipient = User.query.get_or_404(recipient_id)

        # Check if connection already exists
        existing = Connection.query.filter(
            (
                (Connection.requester_id == requester_id)
                & (Connection.recipient_id == recipient_id)
            )
            | (
                (Connection.requester_id == recipient_id)
                & (Connection.recipient_id == requester_id)
            )
        ).first()

        if existing:
            # Allow new connection request if previous was removed
            if existing.status == ConnectionStatus.REMOVED:
                # Update the existing connection instead of creating a new one
                existing.requester_id = requester_id
                existing.recipient_id = recipient_id
                existing.status = ConnectionStatus.PENDING
                existing.icebreaker_message = icebreaker_message
                existing.originating_event_id = originating_event_id
                existing.updated_at = datetime.utcnow()
                db.session.commit()
                return existing
            else:
                raise ValueError("Connection already exists")

        # If event_id is provided, verify both users are part of the event
        if originating_event_id:
            event = Event.query.get_or_404(originating_event_id)

            requester_in_event = EventUser.query.filter_by(
                event_id=originating_event_id, user_id=requester_id
            ).first()
            recipient_in_event = EventUser.query.filter_by(
                event_id=originating_event_id, user_id=recipient_id
            ).first()

            if not requester_in_event or not recipient_in_event:
                raise ValueError("Both users must be part of the event")

        # Create new connection
        connection = Connection(
            requester_id=requester_id,
            recipient_id=recipient_id,
            icebreaker_message=icebreaker_message,
            originating_event_id=originating_event_id,
            status=ConnectionStatus.PENDING,
        )

        db.session.add(connection)
        db.session.commit()

        return connection

    @staticmethod
    def get_connection(connection_id, user_id=None):
        """Get connection details, optionally verifying user access"""
        connection = Connection.query.get_or_404(connection_id)

        # If user_id provided, verify access
        if user_id and (
            connection.requester_id != user_id
            and connection.recipient_id != user_id
        ):
            raise ValueError("Not authorized to view this connection")

        return connection

    @staticmethod
    def update_connection_status(connection_id, user_id, new_status):
        """Update connection status (accept/reject)"""
        connection = Connection.query.get_or_404(connection_id)

        # Only recipient can accept/reject
        if connection.recipient_id != user_id:
            raise ValueError(
                "Only the recipient can accept or reject connections"
            )

        # Only pending connections can be updated
        if connection.status != ConnectionStatus.PENDING:
            raise ValueError("Only pending connections can be updated")

        # Update status
        connection.status = new_status
        connection.updated_at = datetime.utcnow()
        db.session.commit()

        # If accepted, create a direct message thread
        thread_id = None
        if new_status == ConnectionStatus.ACCEPTED:
            # Check if thread already exists
            thread = DirectMessageThread.query.filter(
                (
                    (DirectMessageThread.user1_id == connection.requester_id)
                    & (DirectMessageThread.user2_id == connection.recipient_id)
                )
                | (
                    (DirectMessageThread.user1_id == connection.recipient_id)
                    & (DirectMessageThread.user2_id == connection.requester_id)
                )
            ).first()

            if not thread:
                # Create new thread
                thread = DirectMessageThread(
                    user1_id=connection.requester_id,
                    user2_id=connection.recipient_id,
                    is_encrypted=False,
                )
                db.session.add(thread)
                db.session.flush()

                # Add initial message with the icebreaker
                message = DirectMessage(
                    thread_id=thread.id,
                    sender_id=connection.requester_id,
                    content=connection.icebreaker_message,
                    status=MessageStatus.DELIVERED,
                )
                db.session.add(message)
                db.session.commit()
                
            # Merge any existing event-scoped threads into the global thread
            from api.services.direct_message import DirectMessageService
            DirectMessageService.merge_event_threads_on_connection(
                connection.requester_id, connection.recipient_id
            )

            thread_id = thread.id if thread else None

        return connection, thread_id

    @staticmethod
    def remove_connection(connection_id, user_id):
        """
        Remove an accepted connection (soft delete by changing status).
        Also deletes the global thread to reactivate event-scoped threads.
        
        Args:
            connection_id: ID of the connection to remove
            user_id: ID of the user performing the removal
            
        Returns:
            The updated connection object
            
        Raises:
            ValueError: If user is not authorized or connection is not accepted
        """
        # Import here to avoid circular dependency with DirectMessageThread model
        from api.models.direct_message_thread import DirectMessageThread
        
        connection = Connection.query.get_or_404(connection_id)
        
        # Verify user is part of the connection
        if connection.requester_id != user_id and connection.recipient_id != user_id:
            raise ValueError("Not authorized to remove this connection")
        
        # Only accepted connections can be removed
        if connection.status != ConnectionStatus.ACCEPTED:
            raise ValueError("Can only remove accepted connections")
        
        # Use transaction to ensure atomic operation
        try:
            with db.session.begin_nested():
                # Update status to removed
                connection.status = ConnectionStatus.REMOVED
                connection.updated_at = datetime.utcnow()
                
                # Delete the global thread between these users
                # This will make any event-scoped threads visible again
                global_thread = DirectMessageThread.query.filter(
                    ((DirectMessageThread.user1_id == connection.requester_id) &
                     (DirectMessageThread.user2_id == connection.recipient_id)) |
                    ((DirectMessageThread.user1_id == connection.recipient_id) &
                     (DirectMessageThread.user2_id == connection.requester_id)),
                    DirectMessageThread.event_scope_id.is_(None)  # Global thread only
                ).first()
                
                if global_thread:
                    # Delete the global thread and its messages (cascade delete)
                    # Event-scoped threads remain intact with their original messages
                    db.session.delete(global_thread)
            
            db.session.commit()
            return connection
            
        except Exception as e:
            db.session.rollback()
            raise ValueError(f"Failed to remove connection: {str(e)}")

    @staticmethod
    def get_event_connections(user_id, event_id):
        """Get connected users in an event"""
        # Check if user is in event
        event_user = EventUser.query.filter_by(
            event_id=event_id, user_id=user_id
        ).first()

        if not event_user:
            raise ValueError("Not authorized to access this event")

        # Get all users in the event
        event_users = EventUser.query.filter_by(event_id=event_id).all()
        event_user_ids = [eu.user_id for eu in event_users]

        # Get all connections for the user
        connections = Connection.query.filter(
            (
                (Connection.requester_id == user_id)
                | (Connection.recipient_id == user_id)
            )
            & (Connection.status == ConnectionStatus.ACCEPTED)
        ).all()

        # Filter to only those in the event
        event_connections = []
        for conn in connections:
            other_user_id = (
                conn.recipient_id
                if conn.requester_id == user_id
                else conn.requester_id
            )
            if other_user_id in event_user_ids:
                other_user = User.query.get(other_user_id)
                event_user = EventUser.query.filter_by(
                    event_id=event_id, user_id=other_user_id
                ).first()

                connection_data = {
                    "id": conn.id,
                    "user": {
                        "id": other_user.id,
                        "full_name": other_user.full_name,
                        "image_url": other_user.image_url,
                        "title": other_user.title,
                        "company_name": other_user.company_name,
                        "role": event_user.role.value if event_user else None,
                    },
                }

                # Get thread if it exists
                thread = DirectMessageThread.query.filter(
                    (
                        (DirectMessageThread.user1_id == user_id)
                        & (DirectMessageThread.user2_id == other_user_id)
                    )
                    | (
                        (DirectMessageThread.user1_id == other_user_id)
                        & (DirectMessageThread.user2_id == user_id)
                    )
                ).first()

                if thread:
                    connection_data["thread_id"] = thread.id

                event_connections.append(connection_data)

        return event_connections

    @staticmethod
    def format_connection_for_socket(connection, user_id):
        """Format connection data for socket response"""
        # Determine the other user
        other_user_id = (
            connection.recipient_id
            if connection.requester_id == user_id
            else connection.requester_id
        )
        other_user = User.query.get(other_user_id)

        connection_data = {
            "id": connection.id,
            "status": connection.status.value,
            "created_at": connection.created_at.isoformat(),
            "updated_at": (
                connection.updated_at.isoformat()
                if connection.updated_at
                else connection.created_at.isoformat()
            ),
            "icebreaker_message": connection.icebreaker_message,
            "is_requester": connection.requester_id == user_id,
            "other_user": {
                "id": other_user.id,
                "full_name": other_user.full_name,
                "image_url": other_user.image_url,
                "title": other_user.title,
                "company_name": other_user.company_name,
            },
        }

        if connection.originating_event_id:
            event = Event.query.get(connection.originating_event_id)
            if event:
                connection_data["originating_event"] = {
                    "id": event.id,
                    "title": event.title,
                }

        return connection_data

    @staticmethod
    def format_request_for_socket(connection):
        """Format connection request data for socket response"""
        requester = User.query.get(connection.requester_id)

        request_data = {
            "id": connection.id,
            "created_at": connection.created_at.isoformat(),
            "icebreaker_message": connection.icebreaker_message,
            "requester": {
                "id": requester.id,
                "full_name": requester.full_name,
                "image_url": requester.image_url,
                "title": requester.title,
                "company_name": requester.company_name,
            },
        }

        if connection.originating_event_id:
            event = Event.query.get(connection.originating_event_id)
            if event:
                request_data["originating_event"] = {
                    "id": event.id,
                    "title": event.title,
                }

        return request_data
    
    @staticmethod
    def _apply_user_privacy_filtering(connection, user_attr, viewer):
        """Apply privacy filtering to a user in a connection"""
        from api.services.privacy import PrivacyService
        
        # Get the user object from the connection
        user = getattr(connection, user_attr)
        if not user:
            return
        
        # Since these are connections, they can see each other but with privacy rules
        # Get the privacy context
        context = PrivacyService.get_viewer_context(user, viewer, None)
        
        # Apply privacy filtering
        filtered_data = PrivacyService.filter_user_data(user, context, None)
        
        # Store filtered data as temporary attributes
        user._filtered_email = filtered_data.get('email')
        user._filtered_title = filtered_data.get('title')
        user._filtered_company_name = filtered_data.get('company_name')
        user._filtered_social_links = filtered_data.get('social_links')
        user._filtered_bio = filtered_data.get('bio')
        user._privacy_filtered = True
    
    @staticmethod
    def _apply_user_privacy_filtering_with_event(connection, user_attr, viewer, event_id):
        """Apply privacy filtering to a user in a connection WITH EVENT CONTEXT"""
        from api.services.privacy import PrivacyService
        import logging
        
        # Get the user object from the connection
        user = getattr(connection, user_attr)
        if not user:
            return
        
        # Get the privacy context WITH EVENT ID
        # This is important because it checks if viewer is an event attendee
        context = PrivacyService.get_viewer_context(user, viewer, event_id)
        
        # Apply privacy filtering with event context
        filtered_data = PrivacyService.filter_user_data(user, context, event_id)
        
        # Store filtered data as temporary attributes
        user._filtered_email = filtered_data.get('email')
        user._filtered_title = filtered_data.get('title')
        user._filtered_company_name = filtered_data.get('company_name')
        user._filtered_social_links = filtered_data.get('social_links')
        user._filtered_bio = filtered_data.get('bio')
        user._privacy_filtered = True

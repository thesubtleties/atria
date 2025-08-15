from datetime import datetime, timezone
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import joinedload, selectinload

from api.extensions import db
from api.models import User, Organization, OrganizationUser, Event, EventUser, Connection
from api.models.enums import EventStatus, EventUserRole, ConnectionStatus, OrganizationUserRole


class DashboardService:
    @staticmethod
    def get_user_dashboard(user_id: int):
        """Get dashboard data for a user with optimized queries"""
        user = User.query.get(user_id)
        if not user:
            return None

        # Get user stats
        stats = DashboardService._get_user_stats(user_id)
        
        # Get organizations with role and counts
        organizations = DashboardService._get_user_organizations(user_id)
        
        # Get recent/upcoming events (limit 5)
        events = DashboardService._get_user_events(user_id, limit=5)
        
        # Get recent connections (limit 5)
        connections = DashboardService._get_recent_connections(user_id, limit=5)
        
        # Get news/announcements (static for now)
        news = DashboardService._get_news()

        return {
            'user': user,
            'stats': stats,
            'organizations': organizations,
            'events': events,
            'connections': connections,
            'news': news
        }

    @staticmethod
    def _get_user_stats(user_id: int):
        """Get aggregated statistics for the user"""
        # Events hosted (where user is ADMIN or ORGANIZER and not banned)
        events_hosted = db.session.query(func.count(EventUser.event_id)).filter(
            EventUser.user_id == user_id,
            EventUser.role.in_([EventUserRole.ADMIN, EventUserRole.ORGANIZER]),
            EventUser.is_banned.is_(False)  # Exclude banned users
        ).scalar() or 0

        # Total attendees reached (sum of attendees in events user organized)
        attendees_reached = db.session.query(
            func.count(func.distinct(EventUser.user_id))
        ).join(
            Event, EventUser.event_id == Event.id
        ).filter(
            Event.id.in_(
                db.session.query(EventUser.event_id).filter(
                    EventUser.user_id == user_id,
                    EventUser.role.in_([EventUserRole.ADMIN, EventUserRole.ORGANIZER]),
                    EventUser.is_banned.is_(False)  # Exclude banned users
                )
            ),
            EventUser.user_id != user_id  # Don't count the organizer
        ).scalar() or 0

        # Connections made
        connections_count = db.session.query(func.count(Connection.id)).filter(
            or_(
                and_(Connection.requester_id == user_id, Connection.status == ConnectionStatus.ACCEPTED),
                and_(Connection.recipient_id == user_id, Connection.status == ConnectionStatus.ACCEPTED)
            )
        ).scalar() or 0

        # Events attended (total events user is part of and not banned from)
        events_attended = db.session.query(func.count(EventUser.event_id)).filter(
            EventUser.user_id == user_id,
            EventUser.is_banned.is_(False)  # Exclude banned users
        ).scalar() or 0

        # Organizations count
        organizations_count = db.session.query(func.count(OrganizationUser.organization_id)).filter(
            OrganizationUser.user_id == user_id
        ).scalar() or 0

        return {
            'events_hosted': events_hosted,
            'attendees_reached': attendees_reached,
            'connections_made': connections_count,
            'events_attended': events_attended,
            'organizations_count': organizations_count
        }

    @staticmethod
    def _get_user_organizations(user_id: int):
        """Get user's organizations with role and basic stats"""
        org_users = OrganizationUser.query.filter_by(user_id=user_id).options(
            joinedload(OrganizationUser.organization)
        ).all()

        organizations = []
        for org_user in org_users:
            org = org_user.organization
            
            # Get event count for this organization
            event_count = Event.query.filter_by(organization_id=org.id).count()
            
            # Get member count
            member_count = OrganizationUser.query.filter_by(organization_id=org.id).count()

            organizations.append({
                'id': org.id,
                'name': org.name,
                'role': org_user.role.value,
                'event_count': event_count,
                'member_count': member_count
            })

        return organizations

    @staticmethod
    def _get_user_events(user_id: int, limit: int = 5):
        """Get user's recent and upcoming events (excluding banned)"""
        now = datetime.now(timezone.utc)
        today = now.date()
        
        # Get events where user is a participant and not banned
        event_users = EventUser.query.filter(
            EventUser.user_id == user_id,
            EventUser.is_banned.is_(False)  # Exclude banned users
        ).options(
            joinedload(EventUser.event).joinedload(Event.organization)
        ).join(Event).order_by(
            # Order by: published events first, then by start date
            Event.status == EventStatus.PUBLISHED,
            Event.start_date.asc(),
            Event.end_date.desc()
        ).limit(limit).all()

        events = []
        for event_user in event_users:
            event = event_user.event
            
            # Get attendee count for this event
            attendee_count = EventUser.query.filter_by(event_id=event.id).count()
            
            # Determine event status for display based on dates
            if event.end_date and event.end_date < today:
                display_status = 'past'
            elif event.start_date > today:
                display_status = 'upcoming'
            else:
                # Event is currently happening
                display_status = 'live'

            # Build location string
            location = None
            if event.venue_city:
                location_parts = [event.venue_city]
                if event.venue_state:
                    location_parts.append(event.venue_state)
                if event.venue_country:
                    location_parts.append(event.venue_country)
                location = ', '.join(location_parts)
            elif event.event_format == 'VIRTUAL':
                location = 'Virtual'
            
            events.append({
                'id': event.id,
                'name': event.title,  # Event model uses 'title' not 'name'
                'start_date': event.start_date,
                'end_date': event.end_date,
                'location': location,
                'status': display_status,
                'attendee_count': attendee_count,
                'organization': {
                    'id': event.organization.id,
                    'name': event.organization.name
                },
                'user_role': event_user.role.value
            })

        return events

    @staticmethod
    def _get_recent_connections(user_id: int, limit: int = 5):
        """Get user's most recent connections with privacy filtering"""
        from api.services.privacy import PrivacyService
        
        connections = Connection.query.filter(
            or_(
                and_(Connection.requester_id == user_id, Connection.status == ConnectionStatus.ACCEPTED),
                and_(Connection.recipient_id == user_id, Connection.status == ConnectionStatus.ACCEPTED)
            )
        ).order_by(Connection.updated_at.desc()).limit(limit).options(
            joinedload(Connection.requester),
            joinedload(Connection.recipient)
        ).all()

        # Get the viewer for privacy context
        viewer = User.query.get(user_id)
        
        connection_list = []
        for conn in connections:
            # Get the other user in the connection
            other_user = conn.recipient if conn.requester_id == user_id else conn.requester
            
            # Apply privacy filtering to get what the viewer can see
            context = PrivacyService.get_viewer_context(other_user, viewer, None)
            filtered_data = PrivacyService.filter_user_data(other_user, context, None)
            
            connection_list.append({
                'id': conn.id,
                'user': {
                    'id': other_user.id,
                    'username': other_user.email,  # Using email as username (always visible for connections)
                    'display_name': other_user.full_name,  # Using full_name property (always visible)
                    'avatar_url': other_user.image_url  # Correct field name (always visible)
                },
                'company': filtered_data.get('company_name'),  # Use privacy-filtered data
                'title': filtered_data.get('title'),  # Use privacy-filtered data
                'connected_at': conn.updated_at
            })

        return connection_list

    @staticmethod
    def _get_news():
        """Get platform news/announcements - static for now"""
        # In the future, this could pull from a news/announcements table
        return [
            {
                'id': 1,
                'title': 'New Analytics Dashboard',
                'description': 'Get deeper insights into your event performance with our enhanced analytics suite.',
                'date': datetime(2025, 1, 20, tzinfo=timezone.utc),
                'type': 'platform_update',
                'is_new': True
            },
            {
                'id': 2,
                'title': 'Mobile App Beta Launch',
                'description': 'Take Atria on the go with our new mobile experience. Join the beta program today.',
                'date': datetime(2025, 1, 15, tzinfo=timezone.utc),
                'type': 'product_launch',
                'is_new': False
            },
            {
                'id': 3,
                'title': 'Enhanced Networking Features',
                'description': 'New AI-powered connection recommendations and improved messaging capabilities.',
                'date': datetime(2025, 1, 8, tzinfo=timezone.utc),
                'type': 'feature_release',
                'is_new': False
            },
            {
                'id': 4,
                'title': 'Security Updates',
                'description': 'Latest security enhancements and two-factor authentication improvements.',
                'date': datetime(2025, 1, 1, tzinfo=timezone.utc),
                'type': 'security',
                'is_new': False
            }
        ]

    @staticmethod
    def get_user_invitations(user_id: int):
        """Get all pending invitations for a user"""
        from api.models import OrganizationInvitation, EventInvitation
        from api.models.enums import InvitationStatus
        
        # Get user email with a single query
        user_email = db.session.query(User.email).filter_by(id=user_id).scalar()
        if not user_email:
            raise ValueError("User not found")
        
        # Single query for organization invitations with all relationships
        org_invitations = OrganizationInvitation.query.filter_by(
            email=user_email,
            status=InvitationStatus.PENDING
        ).options(
            joinedload(OrganizationInvitation.organization),
            joinedload(OrganizationInvitation.invited_by)
        ).all()
        
        # Single query for event invitations with all relationships
        event_invitations = EventInvitation.query.filter_by(
            email=user_email,
            status=InvitationStatus.PENDING
        ).options(
            joinedload(EventInvitation.event).joinedload(Event.organization),
            joinedload(EventInvitation.invited_by)
        ).all()
        
        # Format organization invitations
        org_invites_formatted = []
        for inv in org_invitations:
            org_invites_formatted.append({
                'id': inv.id,
                'type': 'organization',
                'organization': {
                    'id': inv.organization.id,
                    'name': inv.organization.name
                },
                'role': inv.role.value,
                'invited_by': {
                    'id': inv.invited_by.id,
                    'name': inv.invited_by.full_name,
                    'email': inv.invited_by.email
                } if inv.invited_by else None,
                'message': inv.message,
                'created_at': inv.created_at,
                'expires_at': inv.expires_at,
                'token': inv.token
            })
        
        # Format event invitations
        event_invites_formatted = []
        for inv in event_invitations:
            event_invites_formatted.append({
                'id': inv.id,
                'type': 'event',
                'event': {
                    'id': inv.event.id,
                    'title': inv.event.title,
                    'start_date': inv.event.start_date,
                    'organization': {
                        'id': inv.event.organization.id,
                        'name': inv.event.organization.name
                    }
                },
                'role': inv.role.value,
                'invited_by': {
                    'id': inv.invited_by.id,
                    'name': inv.invited_by.full_name,
                    'email': inv.invited_by.email
                } if inv.invited_by else None,
                'message': inv.message,
                'created_at': inv.created_at,
                'expires_at': inv.expires_at,
                'token': inv.token
            })
        
        return {
            'organization_invitations': org_invites_formatted,
            'event_invitations': event_invites_formatted,
            'total_count': len(org_invites_formatted) + len(event_invites_formatted)
        }
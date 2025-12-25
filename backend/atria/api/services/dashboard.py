from datetime import datetime, timezone
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import joinedload, selectinload
import pytz

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
        # Events hosted (where user is ADMIN or ORGANIZER and not banned) - Published or Archived
        events_hosted = db.session.query(func.count(EventUser.event_id)).join(
            Event, EventUser.event_id == Event.id
        ).filter(
            EventUser.user_id == user_id,
            EventUser.role.in_([EventUserRole.ADMIN, EventUserRole.ORGANIZER]),
            EventUser.is_banned.is_(False),  # Exclude banned users
            Event.status.in_([EventStatus.PUBLISHED, EventStatus.ARCHIVED])  # Only count real events
        ).scalar() or 0

        # Total attendees reached (sum of attendees in events user organized)
        attendees_reached = db.session.query(
            func.count(func.distinct(EventUser.user_id))
        ).join(
            Event, EventUser.event_id == Event.id
        ).filter(
            Event.id.in_(
                db.session.query(EventUser.event_id).join(
                    Event, EventUser.event_id == Event.id
                ).filter(
                    EventUser.user_id == user_id,
                    EventUser.role.in_([EventUserRole.ADMIN, EventUserRole.ORGANIZER]),
                    EventUser.is_banned.is_(False),  # Exclude banned users
                    Event.status.in_([EventStatus.PUBLISHED, EventStatus.ARCHIVED])  # Only real events
                )
            ),
            EventUser.user_id != user_id,  # Don't count the organizer
            Event.status.in_([EventStatus.PUBLISHED, EventStatus.ARCHIVED])  # Only real events
        ).scalar() or 0

        # Connections made
        connections_count = db.session.query(func.count(Connection.id)).filter(
            or_(
                and_(Connection.requester_id == user_id, Connection.status == ConnectionStatus.ACCEPTED),
                and_(Connection.recipient_id == user_id, Connection.status == ConnectionStatus.ACCEPTED)
            )
        ).scalar() or 0

        # Events attended (total events user is part of and not banned from)
        events_attended = db.session.query(func.count(EventUser.event_id)).join(
            Event, EventUser.event_id == Event.id
        ).filter(
            EventUser.user_id == user_id,
            EventUser.is_banned.is_(False),  # Exclude banned users
            Event.status.in_([EventStatus.PUBLISHED, EventStatus.ARCHIVED])  # Only real events
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
        """Get user's organizations with role and basic stats (alphabetically ordered, case-insensitive)"""
        org_users = OrganizationUser.query.filter_by(user_id=user_id).join(
            Organization
        ).options(
            joinedload(OrganizationUser.organization)
        ).order_by(func.lower(Organization.name).asc()).all()

        organizations = []
        for org_user in org_users:
            org = org_user.organization
            
            # Get event count for this organization (published/archived only)
            event_count = Event.query.filter(
                Event.organization_id == org.id,
                Event.status.in_([EventStatus.PUBLISHED, EventStatus.ARCHIVED])
            ).count()
            
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
        """Get user's events prioritized by status: live > upcoming > recent past

        Priority order:
        1. LIVE events (currently happening)
        2. UPCOMING events (sorted by start_date, soonest first)
        3. PAST events (up to ~2 weeks old, most recent first)

        Returns at most `limit` events.
        """
        from datetime import timedelta

        # Fetch more events than needed so we can filter/prioritize in Python
        # (status calculation requires timezone logic that's cleaner in Python)
        event_users = EventUser.query.filter(
            EventUser.user_id == user_id,
            EventUser.is_banned.is_(False)
        ).options(
            joinedload(EventUser.event).joinedload(Event.organization)
        ).join(Event).filter(
            Event.status == EventStatus.PUBLISHED
        ).all()

        live_events = []
        upcoming_events = []
        past_events = []

        # Calculate cutoff for past events (~2 weeks ago)
        two_weeks_ago = datetime.now(timezone.utc).date() - timedelta(days=14)

        for event_user in event_users:
            event = event_user.event

            # Determine event status based on dates in the event's timezone
            try:
                event_tz = pytz.timezone(event.timezone)
                now_in_event_tz = datetime.now(timezone.utc).astimezone(event_tz)
                today_in_event_tz = now_in_event_tz.date()
            except Exception:
                now_in_event_tz = datetime.now(timezone.utc)
                today_in_event_tz = now_in_event_tz.date()

            # Determine status
            if event.end_date and event.end_date < today_in_event_tz:
                display_status = 'past'
            elif event.start_date > today_in_event_tz:
                display_status = 'upcoming'
            else:
                display_status = 'live'

            # Get attendee count
            attendee_count = EventUser.query.filter(
                EventUser.event_id == event.id,
                EventUser.is_banned.is_(False)
            ).count()

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

            event_data = {
                'id': event.id,
                'name': event.title,
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
            }

            # Categorize by status
            if display_status == 'live':
                live_events.append(event_data)
            elif display_status == 'upcoming':
                upcoming_events.append(event_data)
            elif display_status == 'past' and event.end_date >= two_weeks_ago:
                # Only include past events from the last 2 weeks
                past_events.append(event_data)

        # Sort each category
        # Live: by start_date (earliest live event first)
        live_events.sort(key=lambda e: e['start_date'])
        # Upcoming: by start_date (soonest first)
        upcoming_events.sort(key=lambda e: e['start_date'])
        # Past: by end_date descending (most recently ended first)
        past_events.sort(key=lambda e: e['end_date'], reverse=True)

        # Combine in priority order and return up to limit
        prioritized = live_events + upcoming_events + past_events
        return prioritized[:limit]

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
                'title': 'Early Access Release',
                'description': 'Atria is now live in early access! Experience our event management and networking platform today.',
                'date': datetime(2025, 8, 26, tzinfo=timezone.utc),
                'type': 'platform_update',
                'is_new': True
            },
            {
                'id': 2,
                'title': 'Mobile Chat Enhancement',
                'description': 'Unified and context-aware chat interface for seamless communication on mobile devices.',
                'date': datetime(2025, 8, 26, tzinfo=timezone.utc),
                'type': 'feature_release',
                'is_new': True
            },
            {
                'id': 3,
                'title': 'Real-Time Presence & Typing Indicators',
                'description': 'See who\'s active in chat rooms with live user counts and know when others are typing in direct messages.',
                'date': datetime(2025, 10, 5, tzinfo=timezone.utc),
                'type': 'feature_release',
                'is_new': True
            },
            {
                'id': 4,
                'title': 'v0.1.0 Release',
                'description': 'New features, bug fixes, and improvements are now live! Check out the full changelog at docs.atria.gg/blog',
                'date': datetime(2025, 10, 25, tzinfo=timezone.utc),
                'type': 'platform_update',
                'is_new': True,
                'link': 'https://docs.atria.gg/blog'
            },
            {
                'id': 5,
                'title': 'Documentation Hub Now Available',
                'description': 'Need help getting started? Our comprehensive documentation is now live with guides, tutorials, and API references. Visit docs.atria.gg',
                'date': datetime(2025, 10, 25, tzinfo=timezone.utc),
                'type': 'platform_update',
                'is_new': True,
                'link': 'https://docs.atria.gg'
            },
            {
                'id': 6,
                'title': 'v0.2.0 - Multi-Platform Streaming Release',
                'description': 'Multi-platform video streaming support with Vimeo, Mux, and Zoom integration. Read the full announcement at docs.atria.gg/blog/v0.2.0-release',
                'date': datetime(2025, 11, 8, tzinfo=timezone.utc),
                'type': 'feature_release',
                'is_new': True,
                'link': 'https://docs.atria.gg/blog/v0.2.0-release'
            },
            {
                'id': 7,
                'title': 'v0.3.0 - Jitsi & External Platform Support',
                'description': 'Added Jitsi (JaaS) video conferencing with JWT authentication, plus external link support. Read the full announcement at docs.atria.gg/blog/v0.3.0-release',
                'date': datetime(2025, 11, 26, tzinfo=timezone.utc),
                'type': 'feature_release',
                'is_new': False,
                'link': 'https://docs.atria.gg/blog/v0.3.0-release'
            },
            {
                'id': 8,
                'title': 'v0.4.0 - TypeScript Migration',
                'description': 'Complete frontend TypeScript migration with full type safety and standardized enum handling. Read the full announcement at docs.atria.gg/blog/v0.4.0-release',
                'date': datetime(2025, 12, 24, tzinfo=timezone.utc),
                'type': 'platform_update',
                'is_new': True,
                'link': 'https://docs.atria.gg/blog/v0.4.0-release'
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
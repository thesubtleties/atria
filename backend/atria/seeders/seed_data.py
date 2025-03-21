# seeders/seed_data.py
from datetime import datetime, date, time
from api.extensions import pwd_context


def seed_users():
    return [
        # Demo user (owner)
        {
            "id": 1,
            "email": "demouser@demo.com",
            "password_hash": pwd_context.hash("changeme"),
            "first_name": "Demo",
            "last_name": "User",
            "company_name": "Atria",
            "title": "Platform Lead",
            "bio": "Demo account for testing and exploration",
            "image_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Demo",
            "social_links": {"linkedin": "https://linkedin.com/in/demouser"},
            "is_active": True,
        },
        # Speakers
        {
            "id": 2,
            "email": "sarah.chen@example.com",
            "password_hash": pwd_context.hash("password123"),
            "first_name": "Sarah",
            "last_name": "Chen",
            "company_name": "Netflix",
            "title": "Principal Engineer",
            "bio": "Expert in distributed systems and cloud architecture",
            "image_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
            "social_links": {"linkedin": "https://linkedin.com/in/sarahchen"},
            "is_active": True,
        },
        {
            "id": 3,
            "email": "marcus.rodriguez@example.com",
            "password_hash": pwd_context.hash("password123"),
            "first_name": "Marcus",
            "last_name": "Rodriguez",
            "company_name": "Stripe",
            "title": "Tech Lead",
            "bio": "Performance optimization specialist",
            "image_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
            "social_links": {
                "linkedin": "https://linkedin.com/in/marcusrodriguez"
            },
            "is_active": True,
        },
        {
            "id": 4,
            "email": "emily.johnson@example.com",
            "password_hash": pwd_context.hash("password123"),
            "first_name": "Emily",
            "last_name": "Johnson",
            "company_name": "GitHub",
            "title": "Senior Engineer",
            "bio": "DevOps and automation expert",
            "image_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
            "social_links": {
                "linkedin": "https://linkedin.com/in/emilyjohnson"
            },
            "is_active": True,
        },
    ]


def seed_organizations():
    return [
        {
            "id": 1,
            "name": "Atria Tech Conference",
            "created_at": datetime.utcnow(),
        }
    ]


def seed_organization_users():
    return [{"organization_id": 1, "user_id": 1, "role": "OWNER"}]


def seed_events():
    return [
        {
            "id": 1,
            "organization_id": 1,
            "title": "Atria TechConf 2025",
            "description": "Three-day technology conference featuring industry leaders",
            "hero_description": "Join us for the premier tech conference of 2025, featuring industry leaders from Netflix, Stripe, and GitHub",
            "hero_images": {
                "desktop": "https://example.com/hero-desktop.jpg",
                "mobile": "https://example.com/hero-mobile.jpg",
            },
            "event_type": "CONFERENCE",
            "event_format": "HYBRID",
            "is_private": False,
            "venue_name": "San Francisco Convention Center",
            "venue_address": "747 Howard Street",
            "venue_city": "San Francisco",
            "venue_country": "United States",
            "start_date": date(2025, 3, 15),
            "end_date": date(2025, 3, 17),
            "company_name": "Atria Tech Conference",
            "slug": "atria-techconf-2025",
            "status": "PUBLISHED",
            "branding": {
                "primary_color": "#0066ff",
                "secondary_color": "#ffffff",
                "logo_url": None,
                "banner_url": None,
            },
            "sections": {
                "welcome": {
                    "title": "Welcome to Atria TechConf 2025",
                    "content": "Join us for three days of cutting-edge technology discussions, workshops, and networking",
                },
                "highlights": [
                    {
                        "title": "50+ Industry Speakers",
                        "description": "Learn from tech leaders at Netflix, Stripe, GitHub and more",
                        "icon": "speakers-icon",
                    },
                    {
                        "title": "Hands-on Workshops",
                        "description": "Interactive sessions on React, Docker, and Kubernetes",
                        "icon": "workshop-icon",
                    },
                    {
                        "title": "Hybrid Format",
                        "description": "Join us in San Francisco or stream online",
                        "icon": "hybrid-icon",
                    },
                ],
                "faqs": [
                    {
                        "question": "Is there a virtual attendance option?",
                        "answer": "Yes, all sessions will be streamed live for virtual attendees",
                    },
                    {
                        "question": "Will sessions be recorded?",
                        "answer": "Yes, all sessions will be available on-demand for 30 days after the event",
                    },
                ],
            },
        }
    ]


def seed_event_users():
    return [
        # Demo user as admin
        {
            "event_id": 1,
            "user_id": 1,
            "role": "ADMIN",
            "speaker_title": "Platform Lead @ Atria",
            "speaker_bio": "Demo account for testing and exploration",
        },
        # Other users as speakers
        {
            "event_id": 1,
            "user_id": 2,
            "role": "SPEAKER",
            "speaker_title": "Principal Engineer @ Netflix",
            "speaker_bio": "Expert in distributed systems and cloud architecture",
        },
        {
            "event_id": 1,
            "user_id": 3,
            "role": "SPEAKER",
            "speaker_title": "Tech Lead @ Stripe",
            "speaker_bio": "Performance optimization specialist",
        },
        {
            "event_id": 1,
            "user_id": 4,
            "role": "SPEAKER",
            "speaker_title": "Senior Engineer @ GitHub",
            "speaker_bio": "DevOps and automation expert",
        },
    ]


def seed_sessions():
    return [
        # DAY 1 - March 15, 2025
        {
            "id": 1,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "KEYNOTE",
            "title": "The Future of AI in Software Development",
            "description": "Opening keynote exploring AI's transformative impact on software development.",
            "start_time": time(9, 0),
            "end_time": time(10, 0),
            "stream_url": "https://conference.live/day1-keynote",
            "day_number": 1,
        },
        # Concurrent Morning Sessions
        {
            "id": 2,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "WORKSHOP",
            "title": "React Performance Optimization",
            "description": "Hands-on workshop on optimizing React applications",
            "start_time": time(10, 30),
            "end_time": time(12, 0),
            "stream_url": "https://conference.live/day1-react",
            "day_number": 1,
        },
        {
            "id": 3,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "PRESENTATION",
            "title": "GraphQL Best Practices",
            "description": "Deep dive into GraphQL schema design",
            "start_time": time(10, 30),
            "end_time": time(12, 0),
            "stream_url": "https://conference.live/day1-graphql",
            "day_number": 1,
        },
        {
            "id": 4,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "NETWORKING",
            "title": "Lunch & Networking",
            "description": "Network with fellow developers over lunch",
            "start_time": time(12, 0),
            "end_time": time(13, 30),
            "stream_url": None,
            "day_number": 1,
        },
        {
            "id": 5,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "PANEL",
            "title": "Future of Cloud Computing",
            "description": "Industry leaders discuss cloud evolution",
            "start_time": time(14, 0),
            "end_time": time(15, 30),
            "stream_url": "https://conference.live/day1-cloud-panel",
            "day_number": 1,
        },
        # DAY 2 - March 16, 2025
        {
            "id": 6,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "KEYNOTE",
            "title": "DevOps Evolution: 2025 and Beyond",
            "description": "Morning keynote on the future of DevOps",
            "start_time": time(9, 0),
            "end_time": time(10, 0),
            "stream_url": "https://conference.live/day2-keynote",
            "day_number": 2,
        },
        # Three Concurrent Morning Sessions
        {
            "id": 7,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "WORKSHOP",
            "title": "Docker Deep Dive",
            "description": "Advanced Docker techniques and patterns",
            "start_time": time(10, 30),
            "end_time": time(12, 0),
            "stream_url": "https://conference.live/day2-docker",
            "day_number": 2,
        },
        {
            "id": 8,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "WORKSHOP",
            "title": "Kubernetes in Production",
            "description": "Real-world Kubernetes deployment strategies",
            "start_time": time(10, 30),
            "end_time": time(12, 0),
            "stream_url": "https://conference.live/day2-kubernetes",
            "day_number": 2,
        },
        {
            "id": 9,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "PRESENTATION",
            "title": "CI/CD Best Practices",
            "description": "Modern CI/CD pipeline development",
            "start_time": time(10, 30),
            "end_time": time(12, 0),
            "stream_url": "https://conference.live/day2-cicd",
            "day_number": 2,
        },
        # DAY 3 - March 17, 2025
        {
            "id": 10,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "KEYNOTE",
            "title": "The Future of Web Development",
            "description": "Closing keynote on web development trends",
            "start_time": time(9, 0),
            "end_time": time(10, 0),
            "stream_url": "https://conference.live/day3-keynote",
            "day_number": 3,
        },
        {
            "id": 11,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "WORKSHOP",
            "title": "Advanced TypeScript Patterns",
            "description": "Deep dive into TypeScript development",
            "start_time": time(10, 30),
            "end_time": time(12, 0),
            "stream_url": "https://conference.live/day3-typescript",
            "day_number": 3,
        },
        {
            "id": 12,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "PANEL",
            "title": "Future of Frontend Development",
            "description": "Panel discussion on frontend trends",
            "start_time": time(13, 30),
            "end_time": time(15, 0),
            "stream_url": "https://conference.live/day3-frontend-panel",
            "day_number": 3,
        },
        {
            "id": 13,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "QA",
            "title": "Ask Me Anything: Senior Developers",
            "description": "Open Q&A with experienced developers",
            "start_time": time(15, 30),
            "end_time": time(16, 30),
            "stream_url": "https://conference.live/day3-ama",
            "day_number": 3,
        },
    ]


def seed_session_speakers():
    return [
        # Day 1 Keynote
        {
            "session_id": 1,
            "user_id": 2,  # Sarah Chen
            "role": "KEYNOTE",
            "order": 1,
        },
        # React Workshop
        {
            "session_id": 2,
            "user_id": 3,  # Marcus Rodriguez
            "role": "SPEAKER",
            "order": 1,
        },
        # GraphQL Session
        {
            "session_id": 3,
            "user_id": 4,  # Emily Johnson
            "role": "SPEAKER",
            "order": 1,
        },
        # Cloud Panel (multiple speakers)
        {
            "session_id": 5,
            "user_id": 1,  # Demo User
            "role": "MODERATOR",
            "order": 1,
        },
        {
            "session_id": 5,
            "user_id": 2,  # Sarah Chen
            "role": "PANELIST",
            "order": 2,
        },
        {
            "session_id": 5,
            "user_id": 3,  # Marcus Rodriguez
            "role": "PANELIST",
            "order": 3,
        },
    ]


def seed_chat_rooms():
    return [
        # Global chat room for the event
        {
            "id": 1,
            "event_id": 1,
            "name": "General",
            "description": "General discussion for all attendees",
            "is_global": True,
        },
        # Topic-specific chat rooms
        {
            "id": 2,
            "event_id": 1,
            "name": "Q&A",
            "description": "Ask questions about the event",
            "is_global": False,
        },
        {
            "id": 3,
            "event_id": 1,
            "name": "Networking",
            "description": "Connect with other attendees",
            "is_global": False,
        },
        # Technology-specific chat rooms
        {
            "id": 4,
            "event_id": 1,
            "name": "Frontend",
            "description": "Discuss React, TypeScript, and other frontend technologies",
            "is_global": False,
        },
        {
            "id": 5,
            "event_id": 1,
            "name": "DevOps",
            "description": "Discuss Docker, Kubernetes, and CI/CD",
            "is_global": False,
        },
    ]


def seed_chat_messages():
    return [
        # Messages in General chat
        {
            "id": 1,
            "room_id": 1,
            "user_id": 1,  # Demo User
            "content": "Welcome everyone to Atria TechConf 2025! Feel free to introduce yourselves.",
        },
        {
            "id": 2,
            "room_id": 1,
            "user_id": 2,  # Sarah Chen
            "content": "Hi everyone! I'm Sarah from Netflix. Looking forward to my keynote tomorrow morning.",
        },
        {
            "id": 3,
            "room_id": 1,
            "user_id": 3,  # Marcus Rodriguez
            "content": "Hello from Stripe! Excited to share performance optimization techniques in my workshop.",
        },
        # Messages in Q&A chat
        {
            "id": 4,
            "room_id": 2,
            "user_id": 4,  # Emily Johnson
            "content": "I'll be answering questions about DevOps and automation here after my session.",
        },
        {
            "id": 5,
            "room_id": 2,
            "user_id": 1,  # Demo User
            "content": "For any logistics questions about the venue or schedule, feel free to ask here!",
        },
    ]


def seed_connections():
    return [
        # Demo user connected with all speakers
        {
            "id": 1,
            "requester_id": 1,  # Demo User
            "recipient_id": 2,  # Sarah Chen
            "status": "ACCEPTED",
            "icebreaker_message": "Hi Sarah, I'm organizing the conference and would love to connect!",
            "originating_event_id": 1,
        },
        {
            "id": 2,
            "requester_id": 1,  # Demo User
            "recipient_id": 3,  # Marcus Rodriguez
            "status": "ACCEPTED",
            "icebreaker_message": "Hi Marcus, looking forward to your session on performance optimization!",
            "originating_event_id": 1,
        },
        {
            "id": 3,
            "requester_id": 1,  # Demo User
            "recipient_id": 4,  # Emily Johnson
            "status": "ACCEPTED",
            "icebreaker_message": "Hi Emily, excited to have you speaking about DevOps at our conference!",
            "originating_event_id": 1,
        },
        # Pending connection request
        {
            "id": 4,
            "requester_id": 2,  # Sarah Chen
            "recipient_id": 3,  # Marcus Rodriguez
            "status": "PENDING",
            "icebreaker_message": "Hi Marcus, I enjoyed your talk at last year's conference. Would love to connect!",
            "originating_event_id": 1,
        },
    ]


def seed_direct_message_threads():
    return [
        # Thread between Demo User and Sarah Chen
        {
            "id": 1,
            "user1_id": 1,  # Demo User
            "user2_id": 2,  # Sarah Chen
            "is_encrypted": False,
        },
        # Thread between Demo User and Marcus Rodriguez
        {
            "id": 2,
            "user1_id": 1,  # Demo User
            "user2_id": 3,  # Marcus Rodriguez
            "is_encrypted": False,
        },
        # Thread between Demo User and Emily Johnson
        {
            "id": 3,
            "user1_id": 1,  # Demo User
            "user2_id": 4,  # Emily Johnson
            "is_encrypted": True,  # Example of an encrypted thread
        },
    ]


def seed_direct_messages():
    return [
        # Messages between Demo User and Sarah Chen
        {
            "id": 1,
            "thread_id": 1,
            "sender_id": 1,  # Demo User
            "content": "Hi Sarah, thanks for accepting my connection request!",
            "status": "READ",
        },
        {
            "id": 2,
            "thread_id": 1,
            "sender_id": 2,  # Sarah Chen
            "content": "Hi Demo! Looking forward to the conference.",
            "status": "READ",
        },
        {
            "id": 3,
            "thread_id": 1,
            "sender_id": 1,  # Demo User
            "content": "Great! Let me know if you need anything for your keynote.",
            "status": "READ",
        },
        # Messages between Demo User and Marcus Rodriguez
        {
            "id": 4,
            "thread_id": 2,
            "sender_id": 1,  # Demo User
            "content": "Hi Marcus, just checking if you received the schedule for your workshop?",
            "status": "READ",
        },
        {
            "id": 5,
            "thread_id": 2,
            "sender_id": 3,  # Marcus Rodriguez
            "content": "Yes, got it! Everything looks good.",
            "status": "READ",
        },
        # Messages between Demo User and Emily Johnson (encrypted)
        {
            "id": 6,
            "thread_id": 3,
            "sender_id": 1,  # Demo User
            "content": "Hi Emily, this is an encrypted thread for sensitive discussions.",
            "encrypted_content": "U2FtcGxlIGVuY3J5cHRlZCBjb250ZW50IGZvciBkZW1vIHB1cnBvc2Vz",  # Sample encrypted content
            "status": "READ",
        },
        {
            "id": 7,
            "thread_id": 3,
            "sender_id": 4,  # Emily Johnson
            "content": "Got it, thanks for setting this up!",
            "encrypted_content": "QW5vdGhlciBzYW1wbGUgZW5jcnlwdGVkIG1lc3NhZ2UgZm9yIHRlc3Rpbmc=",  # Sample encrypted content
            "status": "READ",
        },
    ]


def seed_user_encryption_keys():
    return [
        # Sample encryption keys (in a real app, these would be generated client-side)
        {
            "id": 1,
            "user_id": 1,  # Demo User
            "public_key": '{"kty":"RSA","e":"AQAB","n":"sample-public-key-for-demo-user","alg":"RS256"}',
        },
        {
            "id": 2,
            "user_id": 4,  # Emily Johnson
            "public_key": '{"kty":"RSA","e":"AQAB","n":"sample-public-key-for-emily","alg":"RS256"}',
        },
    ]


# Make sure all functions are exported
__all__ = [
    "seed_users",
    "seed_organizations",
    "seed_organization_users",
    "seed_events",
    "seed_event_users",
    "seed_sessions",
    "seed_session_speakers",
    "seed_chat_rooms",
    "seed_chat_messages",
    "seed_connections",
    "seed_direct_message_threads",
    "seed_direct_messages",
    "seed_user_encryption_keys",
]

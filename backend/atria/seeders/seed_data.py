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
        # Additional Attendees
        {
            "id": 5,
            "email": "alex.patel@example.com",
            "password_hash": pwd_context.hash("password123"),
            "first_name": "Alex",
            "last_name": "Patel",
            "company_name": "Startup Inc",
            "title": "Full Stack Developer",
            "bio": "Building scalable web applications",
            "image_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
            "social_links": {"linkedin": "https://linkedin.com/in/alexpatel"},
            "is_active": True,
        },
        {
            "id": 6,
            "email": "jamie.wong@example.com",
            "password_hash": pwd_context.hash("password123"),
            "first_name": "Jamie",
            "last_name": "Wong",
            "company_name": "Tech Solutions",
            "title": "DevOps Engineer",
            "bio": "Container orchestration enthusiast",
            "image_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Jamie",
            "social_links": {"linkedin": "https://linkedin.com/in/jamiewong"},
            "is_active": True,
        },
        {
            "id": 7,
            "email": "taylor.kim@example.com",
            "password_hash": pwd_context.hash("password123"),
            "first_name": "Taylor",
            "last_name": "Kim",
            "company_name": "DataCorp",
            "title": "Data Engineer",
            "bio": "Real-time data processing and analytics",
            "image_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor",
            "social_links": {"linkedin": "https://linkedin.com/in/taylorkim"},
            "is_active": True,
        },
        {
            "id": 8,
            "email": "chris.martinez@example.com",
            "password_hash": pwd_context.hash("password123"),
            "first_name": "Chris",
            "last_name": "Martinez",
            "company_name": "Atria",
            "title": "Event Operations Manager",
            "bio": "Managing event logistics and operations",
            "image_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Chris",
            "social_links": {"linkedin": "https://linkedin.com/in/chrismartinez"},
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
                "desktop": "https://storage.sbtl.dev/spookyspot/atria-event-banner.png",
                "mobile": "https://storage.sbtl.dev/spookyspot/atria-event-banner.png",
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
            "sponsor_tiers": [
                {
                    "id": "platinum",
                    "name": "Platinum Sponsor",
                    "order": 1,
                    "benefits": ["Prime booth location", "5 conference passes", "Logo on all materials", "Speaking opportunity"],
                    "color": "#e5e4e2"
                },
                {
                    "id": "gold", 
                    "name": "Gold Sponsor",
                    "order": 2,
                    "benefits": ["Booth space", "3 conference passes", "Logo on website", "Social media mentions"],
                    "color": "#ffd700"
                },
                {
                    "id": "silver",
                    "name": "Silver Sponsor", 
                    "order": 3,
                    "benefits": ["2 conference passes", "Logo on website", "Attendee list access"],
                    "color": "#c0c0c0"
                },
                {
                    "id": "bronze",
                    "name": "Bronze Sponsor",
                    "order": 4,
                    "benefits": ["1 conference pass", "Logo on website"],
                    "color": "#cd7f32"
                },
                {
                    "id": "community",
                    "name": "Community Partner",
                    "order": 5,
                    "benefits": ["Special recognition", "Logo on community page"],
                    "color": "#ff6611"
                }
            ],
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
        # Additional attendees
        {
            "event_id": 1,
            "user_id": 5,
            "role": "ATTENDEE",
            "speaker_title": None,
            "speaker_bio": None,
        },
        {
            "event_id": 1,
            "user_id": 6,
            "role": "ATTENDEE",
            "speaker_title": None,
            "speaker_bio": None,
        },
        {
            "event_id": 1,
            "user_id": 7,
            "role": "ATTENDEE",
            "speaker_title": None,
            "speaker_bio": None,
        },
        {
            "event_id": 1,
            "user_id": 8,
            "role": "ORGANIZER",  # Chris as an organizer
            "speaker_title": None,
            "speaker_bio": None,
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
            "short_description": "Opening keynote on AI's impact on modern software development practices",
            "description": "Join us for an inspiring opening keynote that explores how AI is revolutionizing software development. From code generation to automated testing, discover how AI tools are changing the way we build software and what this means for developers' careers in the next decade. We'll showcase real-world examples and preview upcoming innovations that will shape our industry.",
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
            "short_description": "Hands-on workshop: Advanced techniques for optimizing React applications",
            "description": "Master the art of React performance optimization in this intensive hands-on workshop. Learn profiling techniques, implement code splitting, optimize renders with memo and useMemo, and discover advanced patterns for handling large datasets. Bring your laptop and a problematic React app to optimize!",
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
            "short_description": "Schema design patterns and performance tips for production GraphQL",
            "description": "Learn battle-tested GraphQL patterns from real production systems. We'll cover schema design principles, resolver optimization, caching strategies, and security considerations. Includes case studies from Netflix's GraphQL implementation serving millions of users.",
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
            "short_description": "Structured networking lunch with topic tables",
            "description": "Join themed networking tables based on your interests: Frontend, Backend, DevOps, AI/ML, Mobile, or Open Source. Each table has a facilitator to spark conversations. Vegetarian, vegan, and gluten-free options available.",
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
            "short_description": "Industry leaders debate multi-cloud strategies and edge computing",
            "description": "Top engineers from Netflix, Stripe, and GitHub discuss the evolution of cloud architecture. Topics include multi-cloud strategies, edge computing, serverless at scale, and the environmental impact of cloud infrastructure. Audience Q&A included.",
            "start_time": time(14, 0),
            "end_time": time(15, 30),
            "stream_url": "https://conference.live/day1-cloud-panel",
            "day_number": 1,
        },
        # Afternoon Break
        {
            "id": 14,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "NETWORKING",
            "title": "Coffee Break & Expo Hall",
            "short_description": "Visit sponsor booths and enjoy afternoon refreshments",
            "description": "Take a break to recharge with coffee and snacks while exploring our sponsor expo. Great opportunity to learn about new tools and services that can help your development workflow.",
            "start_time": time(15, 30),
            "end_time": time(16, 0),
            "stream_url": None,
            "day_number": 1,
        },
        # Late Afternoon Sessions
        {
            "id": 15,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "WORKSHOP",
            "title": "Building Secure APIs",
            "short_description": "Security best practices for modern API development",
            "description": "Learn how to build secure APIs from the ground up. Cover authentication strategies, rate limiting, input validation, and common vulnerabilities. Includes hands-on exercises with JWT, OAuth2, and API gateway patterns.",
            "start_time": time(16, 0),
            "end_time": time(17, 30),
            "stream_url": "https://conference.live/day1-security",
            "day_number": 1,
        },
        {
            "id": 16,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "PRESENTATION",
            "title": "Scaling PostgreSQL to 1 Billion Records",
            "short_description": "Real-world lessons from scaling PostgreSQL in production",
            "description": "Discover proven strategies for scaling PostgreSQL to handle massive datasets. Learn about partitioning, indexing strategies, query optimization, and when to consider alternative solutions. Based on real experiences at scale.",
            "start_time": time(16, 0),
            "end_time": time(17, 30),
            "stream_url": "https://conference.live/day1-postgres",
            "day_number": 1,
        },
        # Evening Event
        {
            "id": 17,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "NETWORKING",
            "title": "Welcome Reception",
            "short_description": "Opening night reception with food, drinks, and networking",
            "description": "Join us for the opening night reception! Enjoy appetizers, drinks, and great conversations with fellow attendees, speakers, and sponsors. Live music and fun activities included.",
            "start_time": time(18, 0),
            "end_time": time(20, 0),
            "stream_url": None,
            "day_number": 1,
        },
        # DAY 2 - March 16, 2025
        {
            "id": 6,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "KEYNOTE",
            "title": "DevOps Evolution: 2025 and Beyond",
            "short_description": "The future of DevOps: Platform engineering, AI ops, and beyond",
            "description": "Explore the evolution of DevOps practices and the rise of platform engineering. Learn how AI is transforming operations, the shift from DevOps to platform teams, and what skills you'll need for the future. Features live demos of cutting-edge tools.",
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
            "short_description": "Advanced Docker patterns: Multi-stage builds, security, and optimization",
            "description": "Go beyond basics with advanced Docker techniques. Master multi-stage builds, implement security scanning, optimize image sizes, and learn debugging strategies. Includes hands-on labs with real-world scenarios from containerizing legacy applications.",
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
            "short_description": "Battle-tested strategies for running K8s at scale",
            "description": "Learn from real production experiences running Kubernetes at scale. Cover cluster design, security hardening, cost optimization, and disaster recovery. Includes war stories and lessons learned from managing 1000+ node clusters.",
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
            "short_description": "Building fast, reliable pipelines with modern CI/CD tools",
            "description": "Design CI/CD pipelines that developers love. Learn about trunk-based development, progressive delivery, feature flags, and automated rollbacks. Compare GitHub Actions, GitLab CI, and other modern tools with real examples.",
            "start_time": time(10, 30),
            "end_time": time(12, 0),
            "stream_url": "https://conference.live/day2-cicd",
            "day_number": 2,
        },
        # Lunch
        {
            "id": 18,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "NETWORKING",
            "title": "Lunch & Learn: Open Source Showcase",
            "short_description": "Lightning talks from open source maintainers during lunch",
            "description": "Enjoy lunch while learning about exciting open source projects. Features 5-minute lightning talks from project maintainers, including tools you use every day. Great opportunity to learn how to contribute.",
            "start_time": time(12, 0),
            "end_time": time(13, 30),
            "stream_url": None,
            "day_number": 2,
        },
        # Afternoon Sessions
        {
            "id": 19,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "WORKSHOP",
            "title": "Microservices Architecture Workshop",
            "short_description": "Design and implement microservices with best practices",
            "description": "Hands-on workshop covering microservices design patterns, service mesh, distributed tracing, and saga patterns. Build a sample e-commerce system using microservices architecture with proper observability.",
            "start_time": time(14, 0),
            "end_time": time(15, 30),
            "stream_url": "https://conference.live/day2-microservices",
            "day_number": 2,
        },
        {
            "id": 20,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "PRESENTATION",
            "title": "WebSocket at Scale: Real-time Systems",
            "short_description": "Building reliable real-time features with WebSockets",
            "description": "Learn how to build scalable real-time systems using WebSockets. Cover load balancing, horizontal scaling, reconnection strategies, and state management. Includes case studies from building real-time collaboration tools.",
            "start_time": time(14, 0),
            "end_time": time(15, 30),
            "stream_url": "https://conference.live/day2-websockets",
            "day_number": 2,
        },
        {
            "id": 21,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "PANEL",
            "title": "Women in Tech Leadership Panel",
            "short_description": "Inspiring stories and advice from women tech leaders",
            "description": "Join accomplished women engineers and leaders for an inspiring discussion about career growth, overcoming challenges, and building inclusive teams. Moderated Q&A session included.",
            "start_time": time(16, 0),
            "end_time": time(17, 30),
            "stream_url": "https://conference.live/day2-women-panel",
            "day_number": 2,
        },
        # Evening Event
        {
            "id": 22,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "NETWORKING",
            "title": "Conference Party & Hackathon Kickoff",
            "short_description": "Evening party with music, games, and hackathon team formation",
            "description": "Join us for the conference party! Live DJ, arcade games, and great food. Form teams for the overnight hackathon with prizes totaling $10,000. Non-hackers welcome to enjoy the party!",
            "start_time": time(19, 0),
            "end_time": time(22, 0),
            "stream_url": None,
            "day_number": 2,
        },
        # DAY 3 - March 17, 2025
        {
            "id": 10,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "KEYNOTE",
            "title": "The Future of Web Development",
            "short_description": "WebAssembly, Edge Computing, and the next decade of the web",
            "description": "Explore emerging web technologies that will shape the next decade. Deep dive into WebAssembly use cases, edge computing platforms, and new web APIs. Features demos of experimental technologies and a vision for the future of web development.",
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
            "short_description": "Type gymnastics: Advanced TypeScript for library authors",
            "description": "Master advanced TypeScript patterns used in popular libraries. Learn conditional types, mapped types, template literal types, and type inference tricks. Perfect for developers building type-safe libraries or complex applications.",
            "start_time": time(10, 30),
            "end_time": time(12, 0),
            "stream_url": "https://conference.live/day3-typescript",
            "day_number": 3,
        },
        {
            "id": 23,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "PRESENTATION",
            "title": "Machine Learning for Web Developers",
            "short_description": "Practical ML: TensorFlow.js and on-device inference",
            "description": "Demystify machine learning for web developers. Learn to integrate pre-trained models, perform on-device inference, and build ML-powered features. No PhD required! Includes practical examples you can implement today.",
            "start_time": time(10, 30),
            "end_time": time(12, 0),
            "stream_url": "https://conference.live/day3-ml",
            "day_number": 3,
        },
        {
            "id": 24,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "PRESENTATION",
            "title": "Hackathon Winner Presentations",
            "short_description": "Top 5 hackathon teams present their projects",
            "description": "Watch the top 5 teams from last night's hackathon present their innovative projects. Amazing what can be built in 24 hours! Audience votes for People's Choice Award.",
            "start_time": time(12, 0),
            "end_time": time(13, 0),
            "stream_url": "https://conference.live/day3-hackathon",
            "day_number": 3,
        },
        {
            "id": 12,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "PANEL",
            "title": "Future of Frontend Development",
            "short_description": "React, Vue, Angular experts debate the future of frontend",
            "description": "Core team members from React, Vue, and Angular discuss the future of frontend frameworks. Topics include signals, server components, hydration strategies, and whether we'll ever agree on anything. Moderated by a neutral party!",
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
            "title": "Ask Me Anything: Conference Speakers",
            "short_description": "Open Q&A session with all conference speakers",
            "description": "Your chance to ask anything! All conference speakers gather for an open Q&A session. Career advice, technical deep dives, industry insights - no topic off limits. Submit questions via the conference app.",
            "start_time": time(15, 30),
            "end_time": time(16, 30),
            "stream_url": "https://conference.live/day3-ama",
            "day_number": 3,
        },
        {
            "id": 25,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "KEYNOTE",
            "title": "Closing Ceremony & Awards",
            "short_description": "Conference wrap-up, awards, and announcement of next year",
            "description": "Join us for the closing ceremony! We'll announce hackathon winners, share conference highlights, and reveal the location and dates for Atria TechConf 2026. Don't miss the surprise announcement!",
            "start_time": time(17, 0),
            "end_time": time(18, 0),
            "stream_url": "https://conference.live/day3-closing",
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
        # Building Secure APIs
        {
            "session_id": 15,
            "user_id": 6,  # Jamie Wong (DevOps)
            "role": "SPEAKER",
            "order": 1,
        },
        # Scaling PostgreSQL
        {
            "session_id": 16,
            "user_id": 7,  # Taylor Kim (Data Engineer)
            "role": "SPEAKER",
            "order": 1,
        },
        # Day 2 DevOps Keynote
        {
            "session_id": 6,
            "user_id": 4,  # Emily Johnson
            "role": "KEYNOTE",
            "order": 1,
        },
        # Docker Workshop
        {
            "session_id": 7,
            "user_id": 6,  # Jamie Wong
            "role": "SPEAKER",
            "order": 1,
        },
        # Kubernetes Workshop
        {
            "session_id": 8,
            "user_id": 8,  # Chris Martinez (Atria)
            "role": "SPEAKER",
            "order": 1,
        },
        # CI/CD Presentation
        {
            "session_id": 9,
            "user_id": 4,  # Emily Johnson
            "role": "SPEAKER",
            "order": 1,
        },
        # Microservices Workshop
        {
            "session_id": 19,
            "user_id": 2,  # Sarah Chen
            "role": "SPEAKER",
            "order": 1,
        },
        # WebSocket Presentation
        {
            "session_id": 20,
            "user_id": 5,  # Alex Patel (Full Stack)
            "role": "SPEAKER",
            "order": 1,
        },
        # Women in Tech Panel
        {
            "session_id": 21,
            "user_id": 1,  # Demo User as moderator
            "role": "MODERATOR",
            "order": 1,
        },
        {
            "session_id": 21,
            "user_id": 2,  # Sarah Chen
            "role": "PANELIST",
            "order": 2,
        },
        {
            "session_id": 21,
            "user_id": 4,  # Emily Johnson
            "role": "PANELIST",
            "order": 3,
        },
        # Day 3 Keynote
        {
            "session_id": 10,
            "user_id": 3,  # Marcus Rodriguez
            "role": "KEYNOTE",
            "order": 1,
        },
        # TypeScript Workshop
        {
            "session_id": 11,
            "user_id": 5,  # Alex Patel
            "role": "SPEAKER",
            "order": 1,
        },
        # ML for Web Devs
        {
            "session_id": 23,
            "user_id": 7,  # Taylor Kim (Data)
            "role": "SPEAKER",
            "order": 1,
        },
        # Frontend Panel
        {
            "session_id": 12,
            "user_id": 1,  # Demo User moderator
            "role": "MODERATOR",
            "order": 1,
        },
        {
            "session_id": 12,
            "user_id": 3,  # Marcus Rodriguez
            "role": "PANELIST",
            "order": 2,
        },
        {
            "session_id": 12,
            "user_id": 5,  # Alex Patel
            "role": "PANELIST",
            "order": 3,
        },
        # AMA - All speakers
        {
            "session_id": 13,
            "user_id": 1,  # Demo User
            "role": "MODERATOR",
            "order": 1,
        },
        {
            "session_id": 13,
            "user_id": 2,  # Sarah Chen
            "role": "SPEAKER",
            "order": 2,
        },
        {
            "session_id": 13,
            "user_id": 3,  # Marcus Rodriguez
            "role": "SPEAKER",
            "order": 3,
        },
        {
            "session_id": 13,
            "user_id": 4,  # Emily Johnson
            "role": "SPEAKER",
            "order": 4,
        },
        # Closing Ceremony
        {
            "session_id": 25,
            "user_id": 1,  # Demo User
            "role": "SPEAKER",
            "order": 1,
        },
        {
            "session_id": 25,
            "user_id": 8,  # Chris Martinez (Atria)
            "role": "SPEAKER",
            "order": 2,
        },
    ]


def seed_chat_rooms():
    rooms = [
        # Global chat room for the event
        {
            "id": 1,
            "event_id": 1,
            "session_id": None,
            "name": "General",
            "description": "General discussion for all attendees",
            "room_type": "GLOBAL",
            "is_enabled": True,
        },
        # Topic-specific chat rooms
        {
            "id": 2,
            "event_id": 1,
            "session_id": None,
            "name": "Q&A",
            "description": "Ask questions about the event",
            "room_type": "GLOBAL",
            "is_enabled": True,
        },
        {
            "id": 3,
            "event_id": 1,
            "session_id": None,
            "name": "Networking",
            "description": "Connect with other attendees",
            "room_type": "GLOBAL",
            "is_enabled": True,
        },
        # Technology-specific chat rooms
        {
            "id": 4,
            "event_id": 1,
            "session_id": None,
            "name": "Frontend",
            "description": "Discuss React, TypeScript, and other frontend technologies",
            "room_type": "GLOBAL",
            "is_enabled": True,
        },
        {
            "id": 5,
            "event_id": 1,
            "session_id": None,
            "name": "DevOps",
            "description": "Discuss Docker, Kubernetes, and CI/CD",
            "room_type": "GLOBAL",
            "is_enabled": True,
        },
        # Admin-only chat rooms
        {
            "id": 6,
            "event_id": 1,
            "session_id": None,
            "name": "Staff Coordination",
            "description": "Private room for event staff and organizers",
            "room_type": "ADMIN",
            "is_enabled": True,
        },
        {
            "id": 7,
            "event_id": 1,
            "session_id": None,
            "name": "Speaker Green Room",
            "description": "Private space for speakers, admins, and organizers to coordinate",
            "room_type": "GREEN_ROOM",
            "is_enabled": True,
        },
    ]
    
    # Add session-specific chat rooms
    room_id = 8
    sessions = seed_sessions()
    
    for session in sessions:
        # Public chat room for each session
        rooms.append({
            "id": room_id,
            "event_id": session["event_id"],
            "session_id": session["id"],
            "name": f"{session['title']} - Chat",
            "description": f"Public discussion for {session['title']}",
            "room_type": "PUBLIC",
            "is_enabled": True,
        })
        room_id += 1
        
        # Backstage chat room for each session
        rooms.append({
            "id": room_id,
            "event_id": session["event_id"],
            "session_id": session["id"],
            "name": f"{session['title']} - Backstage",
            "description": "Speaker and organizer coordination",
            "room_type": "BACKSTAGE",
            "is_enabled": True,
        })
        room_id += 1
    
    return rooms


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
        {
            "id": 4,
            "room_id": 1,
            "user_id": 5,  # Alex Patel
            "content": "Hey all! Alex here, full stack dev. This is my first Atria conference!",
        },
        {
            "id": 5,
            "room_id": 1,
            "user_id": 6,  # Jamie Wong
            "content": "Welcome Alex! You're going to love it. Make sure to check out the Docker workshop.",
        },
        # Messages in Q&A chat
        {
            "id": 6,
            "room_id": 2,
            "user_id": 4,  # Emily Johnson
            "content": "I'll be answering questions about DevOps and automation here after my session.",
        },
        {
            "id": 7,
            "room_id": 2,
            "user_id": 1,  # Demo User
            "content": "For any logistics questions about the venue or schedule, feel free to ask here!",
        },
        {
            "id": 8,
            "room_id": 2,
            "user_id": 7,  # Taylor Kim
            "content": "Will the sessions be recorded? I have a conflict with two workshops I want to attend.",
        },
        {
            "id": 9,
            "room_id": 2,
            "user_id": 1,  # Demo User
            "content": "Yes Taylor! All sessions will be available on-demand for 30 days after the event.",
        },
        # Messages in Networking chat
        {
            "id": 10,
            "room_id": 3,
            "user_id": 8,  # Chris Martinez
            "content": "Anyone interested in discussing cloud architecture over coffee? I'll be at the networking lounge.",
        },
        {
            "id": 11,
            "room_id": 3,
            "user_id": 7,  # Taylor Kim
            "content": "I'd love to join! I'm working on real-time data processing in the cloud.",
        },
        # Messages in Frontend chat
        {
            "id": 12,
            "room_id": 4,
            "user_id": 5,  # Alex Patel
            "content": "Anyone else excited about the React performance workshop? I've been struggling with render optimization.",
        },
        {
            "id": 13,
            "room_id": 4,
            "user_id": 3,  # Marcus Rodriguez
            "content": "That's exactly what we'll cover! Bring your specific use cases and we can work through them.",
        },
        # Messages in DevOps chat
        {
            "id": 14,
            "room_id": 5,
            "user_id": 6,  # Jamie Wong
            "content": "Looking forward to the Kubernetes workshop. We're migrating from Docker Swarm.",
        },
        {
            "id": 15,
            "room_id": 5,
            "user_id": 4,  # Emily Johnson
            "content": "Great timing! We'll cover migration strategies in the afternoon session.",
        },
        # Messages in Admin rooms
        {
            "id": 16,
            "room_id": 6,  # Staff Coordination
            "user_id": 1,  # Demo User
            "content": "Team, please make sure all session rooms are ready 15 minutes before start time.",
        },
        {
            "id": 17,
            "room_id": 6,
            "user_id": 8,  # Chris Martinez (Organizer)
            "content": "Confirmed. AV team is doing final checks now.",
        },
        {
            "id": 18,
            "room_id": 7,  # Speaker Green Room
            "user_id": 2,  # Sarah Chen (Speaker)
            "content": "Is there a clicker available for the keynote presentation?",
        },
        {
            "id": 19,
            "room_id": 7,
            "user_id": 1,  # Demo User
            "content": "Yes Sarah, we have clickers at the AV desk. I'll have one ready for you.",
        },
        # Messages in session-specific chat (React Performance Workshop)
        {
            "id": 20,
            "room_id": 8,  # First session chat room
            "user_id": 3,  # Marcus Rodriguez
            "content": "Welcome to the React Performance workshop! Feel free to ask questions here during the session.",
        },
        {
            "id": 21,
            "room_id": 8,
            "user_id": 5,  # Alex Patel
            "content": "Should we use React.memo for all components or just expensive ones?",
        },
        {
            "id": 22,
            "room_id": 8,
            "user_id": 3,  # Marcus Rodriguez
            "content": "Great question! Only use it for components that re-render often with the same props. I'll demonstrate this next.",
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


def seed_sponsors():
    return [
        # Platinum Sponsors - Core technologies
        {
            "id": 1,
            "event_id": 1,
            "name": "React",
            "description": "A JavaScript library for building user interfaces",
            "website_url": "https://react.dev",
            "logo_url": "https://ui-avatars.com/api/?name=React&size=256&background=61DAFB&color=000",
            "tier_id": "platinum",
            "is_active": True,
            "featured": True,
            "social_links": {"twitter": "https://twitter.com/reactjs", "linkedin": None},
        },
        {
            "id": 2,
            "event_id": 1,
            "name": "PostgreSQL",
            "description": "The world's most advanced open source database",
            "website_url": "https://www.postgresql.org",
            "logo_url": "https://ui-avatars.com/api/?name=PostgreSQL&size=256&background=336791&color=fff",
            "tier_id": "platinum",
            "is_active": True,
            "featured": True,
            "social_links": {"twitter": "https://twitter.com/postgresql", "linkedin": None},
        },
        # Gold Sponsors - Main frameworks
        {
            "id": 3,
            "event_id": 1,
            "name": "Flask",
            "description": "A lightweight WSGI web application framework",
            "website_url": "https://flask.palletsprojects.com",
            "logo_url": "https://ui-avatars.com/api/?name=Flask&size=256&background=000&color=fff",
            "tier_id": "gold",
            "is_active": True,
            "featured": False,
            "social_links": {"twitter": None, "linkedin": None},
        },
        {
            "id": 4,
            "event_id": 1,
            "name": "Mantine",
            "description": "Full-featured React components library",
            "website_url": "https://mantine.dev",
            "logo_url": "https://ui-avatars.com/api/?name=Mantine&size=256&background=339AF0&color=fff",
            "tier_id": "gold",
            "is_active": True,
            "featured": False,
            "social_links": {"twitter": "https://twitter.com/mantinedev", "linkedin": None},
        },
        # Silver Sponsors - Key infrastructure
        {
            "id": 5,
            "event_id": 1,
            "name": "Socket.IO",
            "description": "Bidirectional and low-latency communication",
            "website_url": "https://socket.io",
            "logo_url": "https://ui-avatars.com/api/?name=Socket.IO&size=256&background=010101&color=fff",
            "tier_id": "silver",
            "is_active": True,
            "featured": False,
            "social_links": {"twitter": None, "linkedin": None},
        },
        {
            "id": 6,
            "event_id": 1,
            "name": "SQLAlchemy",
            "description": "The Python SQL Toolkit and ORM",
            "website_url": "https://www.sqlalchemy.org",
            "logo_url": "https://ui-avatars.com/api/?name=SQLAlchemy&size=256&background=D71E00&color=fff",
            "tier_id": "silver",
            "is_active": True,
            "featured": False,
            "social_links": {"twitter": None, "linkedin": None},
        },
        # Bronze Sponsors - Supporting tools
        {
            "id": 7,
            "event_id": 1,
            "name": "MinIO",
            "description": "High-performance object storage",
            "website_url": "https://min.io",
            "logo_url": "https://ui-avatars.com/api/?name=MinIO&size=256&background=C72E49&color=fff",
            "tier_id": "bronze",
            "is_active": True,
            "featured": False,
            "social_links": {"twitter": "https://twitter.com/minio", "linkedin": None},
        },
        {
            "id": 8,
            "event_id": 1,
            "name": "Vite",
            "description": "Next generation frontend tooling",
            "website_url": "https://vitejs.dev",
            "logo_url": "https://ui-avatars.com/api/?name=Vite&size=256&background=646CFF&color=fff",
            "tier_id": "bronze",
            "is_active": True,
            "featured": False,
            "social_links": {"twitter": "https://twitter.com/vite_js", "linkedin": None},
        },
        {
            "id": 9,
            "event_id": 1,
            "name": "Marshmallow",
            "description": "Object serialization/deserialization library",
            "website_url": "https://marshmallow.readthedocs.io",
            "logo_url": "https://ui-avatars.com/api/?name=Marshmallow&size=256&background=5F4B8B&color=fff",
            "tier_id": "bronze",
            "is_active": True,
            "featured": False,
            "social_links": {"twitter": None, "linkedin": None},
        },
        {
            "id": 10,
            "event_id": 1,
            "name": "Zod",
            "description": "TypeScript-first schema validation",
            "website_url": "https://zod.dev",
            "logo_url": "https://ui-avatars.com/api/?name=Zod&size=256&background=3068B7&color=fff",
            "tier_id": "bronze",
            "is_active": True,
            "featured": False,
            "social_links": {"twitter": None, "linkedin": None},
        },
        {
            "id": 11,
            "event_id": 1,
            "name": "Swagger/OpenAPI",
            "description": "API documentation and design tools",
            "website_url": "https://swagger.io",
            "logo_url": "https://ui-avatars.com/api/?name=Swagger&size=256&background=85EA2D&color=000",
            "tier_id": "bronze",
            "is_active": True,
            "featured": False,
            "social_links": {"twitter": "https://twitter.com/swaggerapi", "linkedin": None},
        },
        # Community Partner - Special recognition for Mozilla
        {
            "id": 12,
            "event_id": 1,
            "name": "Mozilla",
            "description": "Building a better Internet through open source",
            "website_url": "https://www.mozilla.org",
            "logo_url": "https://ui-avatars.com/api/?name=Mozilla&size=256&background=FF6611&color=fff",
            "tier_id": "community",
            "is_active": True,
            "featured": True,  # Featured because you like them!
            "social_links": {"twitter": "https://twitter.com/mozilla", "linkedin": "https://linkedin.com/company/mozilla"},
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
    "seed_sponsors",
    "seed_chat_rooms",
    "seed_chat_messages",
    "seed_connections",
    "seed_direct_message_threads",
    "seed_direct_messages",
    "seed_user_encryption_keys",
]

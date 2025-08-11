# seeders/comprehensive_seed_data.py
from datetime import datetime, date, time, timedelta
from api.extensions import pwd_context
import random
from typing import List, Dict, Any
from .enhanced_sessions import generate_enhanced_sessions
from .enhanced_chat import generate_enhanced_chat_messages
from .long_dm_conversation import generate_long_dm_conversations

# Keep the demo user as our main account
DEMO_USER_ID = 1
PASSWORD = "changeme"  # Default password for all seeded users

def generate_users() -> List[Dict[str, Any]]:
    """Generate 75+ users with varied roles and companies"""
    # Set seed for reproducibility - this ensures same users are generated each time
    random.seed(42)
    
    users = []
    
    # Demo user (always first)
    users.append({
        "id": DEMO_USER_ID,
        "email": "demouser@demo.com",
        "password_hash": pwd_context.hash(PASSWORD),
        "first_name": "Demo",
        "last_name": "User",
        "company_name": "Atria Platform",
        "title": "Platform Lead",
        "bio": "Demo account for testing and exploration. Leading the Atria event management platform.",
        "image_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=DemoUser",
        "social_links": {
            "linkedin": "https://linkedin.com/in/demouser",
            "twitter": "https://twitter.com/demouser"
        },
        "is_active": True,
        "email_verified": True,  # Manually confirmed
    })
    
    # Tech companies for variety
    companies = [
        ("Netflix", ["Principal Engineer", "Senior Engineer", "Tech Lead", "Engineering Manager", "Staff Engineer"]),
        ("Stripe", ["Tech Lead", "Senior Engineer", "Platform Engineer", "Payment Systems Engineer", "Security Engineer"]),
        ("GitHub", ["Senior Engineer", "DevOps Lead", "Product Engineer", "Principal Engineer", "Engineering Manager"]),
        ("Google", ["Staff Engineer", "Senior SWE", "Tech Lead Manager", "Principal Engineer", "Distinguished Engineer"]),
        ("Meta", ["Software Engineer", "Senior Engineer", "Tech Lead", "Engineering Manager", "Research Engineer"]),
        ("Amazon", ["Senior SDE", "Principal Engineer", "Solutions Architect", "Tech Lead", "Engineering Manager"]),
        ("Microsoft", ["Principal Engineer", "Senior Engineer", "Azure Architect", "Tech Lead", "Product Manager"]),
        ("Apple", ["Senior Engineer", "iOS Developer", "Machine Learning Engineer", "Platform Engineer", "Tech Lead"]),
        ("Spotify", ["Backend Engineer", "Data Engineer", "Mobile Developer", "Platform Engineer", "Tech Lead"]),
        ("Airbnb", ["Full Stack Engineer", "Senior Engineer", "Tech Lead", "Infrastructure Engineer", "Data Scientist"]),
        ("Tesla", ["Software Engineer", "Embedded Systems Engineer", "ML Engineer", "Senior Engineer", "Tech Lead"]),
        ("OpenAI", ["Research Engineer", "ML Engineer", "Systems Engineer", "Senior Engineer", "Tech Lead"]),
        ("Uber", ["Senior Engineer", "Backend Engineer", "Mobile Developer", "Tech Lead", "Engineering Manager"]),
        ("Lyft", ["Software Engineer", "Senior Engineer", "Platform Engineer", "Tech Lead", "Data Engineer"]),
        ("Coinbase", ["Blockchain Engineer", "Senior Engineer", "Security Engineer", "Tech Lead", "Platform Engineer"]),
        ("Square", ["Payment Systems Engineer", "Senior Engineer", "Mobile Developer", "Tech Lead", "Platform Engineer"]),
        ("Twilio", ["Senior Engineer", "Communications Engineer", "Platform Engineer", "Tech Lead", "Solutions Architect"]),
        ("Slack", ["Frontend Engineer", "Backend Engineer", "Senior Engineer", "Tech Lead", "Platform Engineer"]),
        ("Zoom", ["Video Engineer", "Senior Engineer", "Platform Engineer", "Tech Lead", "Infrastructure Engineer"]),
        ("Dropbox", ["Senior Engineer", "Infrastructure Engineer", "Security Engineer", "Tech Lead", "Storage Engineer"])
    ]
    
    # Startups and smaller companies
    startups = [
        ("TechStartup Inc", ["Founder", "CTO", "Full Stack Developer", "Lead Engineer", "Product Manager"]),
        ("AI Solutions", ["ML Engineer", "Data Scientist", "Senior Developer", "Tech Lead", "AI Researcher"]),
        ("CloudNext", ["DevOps Engineer", "Cloud Architect", "Senior Engineer", "Platform Lead", "SRE"]),
        ("DataFlow Systems", ["Data Engineer", "Analytics Lead", "Senior Developer", "Tech Lead", "BI Developer"]),
        ("SecureWeb", ["Security Engineer", "Senior Developer", "Penetration Tester", "Tech Lead", "Security Architect"]),
        ("MobileFirst", ["iOS Developer", "Android Developer", "Mobile Lead", "Senior Engineer", "React Native Developer"]),
        ("WebScale Co", ["Frontend Developer", "Backend Developer", "Full Stack Engineer", "Tech Lead", "DevOps Engineer"]),
        ("Innovation Labs", ["Research Engineer", "Senior Developer", "Lab Director", "Tech Lead", "Product Engineer"])
    ]
    
    # Combine all companies
    all_companies = companies + startups
    
    # Common first names
    first_names = [
        "Sarah", "Marcus", "Emily", "Alex", "Jamie", "Taylor", "Chris", "Jordan", "Morgan", "Casey",
        "Avery", "Riley", "Quinn", "Blake", "Drew", "Sage", "River", "Sky", "Phoenix", "Rowan",
        "Kai", "Aria", "Luna", "Nova", "Zara", "Leo", "Maya", "Ethan", "Olivia", "Liam",
        "Emma", "Noah", "Ava", "Lucas", "Sophia", "Mason", "Isabella", "Logan", "Mia", "James",
        "Charlotte", "Benjamin", "Amelia", "Jacob", "Harper", "Michael", "Evelyn", "Elijah", "Abigail", "William",
        "Daniel", "Henry", "Alexander", "Jackson", "Sebastian", "Aiden", "Matthew", "Ella", "Grace", "Chloe",
        "Camila", "Penelope", "Lily", "Aria", "Layla", "Scarlett", "Victoria", "Madison", "Luna", "Zoey",
        "Raj", "Priya", "Wei", "Yuki", "Ahmed", "Fatima", "Carlos", "Sofia", "Pierre", "Marie"
    ]
    
    # Common last names
    last_names = [
        "Chen", "Rodriguez", "Johnson", "Patel", "Wong", "Kim", "Martinez", "Anderson", "Taylor", "Thomas",
        "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Lewis", "Lee", "Walker", "Hall",
        "Allen", "Young", "King", "Wright", "Lopez", "Hill", "Scott", "Green", "Adams", "Baker",
        "Nelson", "Carter", "Mitchell", "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards",
        "Collins", "Stewart", "Morris", "Murphy", "Cook", "Rogers", "Morgan", "Peterson", "Cooper", "Reed",
        "Nakamura", "Suzuki", "Kumar", "Singh", "Ahmed", "Ali", "Hassan", "Nguyen", "Tran", "Park"
    ]
    
    # Bio templates
    bio_templates = [
        "Passionate about {focus} with {years} years of experience in {field}",
        "Building scalable {type} systems at {company}. Interested in {interest}",
        "Former {previous_role}, now focusing on {current_focus} at {company}",
        "{years}+ years in tech. Specializing in {specialty}. Love {hobby}",
        "Engineering leader focused on {focus}. Speaker and {interest} enthusiast",
        "Full-stack developer with expertise in {tech_stack}. Building the future of {field}",
        "{role} at {company}. Passionate about {passion} and {interest}",
        "Tech enthusiast working on {project_type} problems. {hobby} in my free time",
        "Solving {problem_type} problems at scale. Previously at {previous_company}",
        "{years} years building {product_type}. Interested in {emerging_tech}"
    ]
    
    focuses = ["distributed systems", "machine learning", "cloud infrastructure", "mobile development", 
               "web applications", "data pipelines", "security", "DevOps", "frontend development", 
               "backend systems", "real-time systems", "blockchain", "AI/ML", "platform engineering"]
    
    interests = ["open source", "mentoring", "public speaking", "writing", "teaching", "research",
                 "startups", "innovation", "automation", "optimization", "architecture", "design"]
    
    hobbies = ["hiking", "photography", "cooking", "gaming", "reading", "traveling", "music",
              "running", "cycling", "yoga", "painting", "writing", "podcasting", "blogging"]
    
    # Generate users 2-80
    used_emails = set()
    used_emails.add("demouser@demo.com")  # Add demo user email
    
    for i in range(2, 81):
        # Keep generating names until we get a unique email
        attempts = 0
        while attempts < 100:
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            email = f"{first_name.lower()}.{last_name.lower()}@example.com"
            
            if email not in used_emails:
                used_emails.add(email)
                break
            
            attempts += 1
            # If we can't find unique combo, add number
            if attempts >= 50:
                email = f"{first_name.lower()}.{last_name.lower()}{i}@example.com"
                if email not in used_emails:
                    used_emails.add(email)
                    break
        
        company, titles = random.choice(all_companies)
        title = random.choice(titles)
        
        # Create bio
        bio_template = random.choice(bio_templates)
        bio = bio_template.format(
            focus=random.choice(focuses),
            years=random.randint(2, 15),
            field=random.choice(["tech", "software", "engineering", "development"]),
            company=company,
            interest=random.choice(interests),
            type=random.choice(["distributed", "scalable", "real-time", "cloud-native"]),
            previous_role=random.choice(["consultant", "freelancer", "researcher", "founder"]),
            current_focus=random.choice(focuses),
            specialty=random.choice(focuses),
            hobby=random.choice(hobbies),
            tech_stack=random.choice(["React/Node", "Python/Django", "Java/Spring", "Go/Kubernetes"]),
            role=title,
            passion=random.choice(interests),
            project_type=random.choice(["complex", "challenging", "interesting", "scaling"]),
            problem_type=random.choice(["engineering", "technical", "business", "data"]),
            previous_company=random.choice([c[0] for c in companies[:10]]),
            product_type=random.choice(["products", "platforms", "applications", "systems"]),
            emerging_tech=random.choice(["Web3", "AI", "quantum computing", "AR/VR", "IoT"])
        )
        
        # Some users don't have all social links
        social_links = {}
        if random.random() > 0.3:  # 70% have LinkedIn
            social_links["linkedin"] = f"https://linkedin.com/in/{first_name.lower()}{last_name.lower()}"
        if random.random() > 0.6:  # 40% have Twitter
            social_links["twitter"] = f"https://twitter.com/{first_name.lower()}_{last_name.lower()}"
        if random.random() > 0.8:  # 20% have GitHub shown
            social_links["github"] = f"https://github.com/{first_name.lower()}{last_name.lower()}"
        
        users.append({
            "id": i,
            "email": email,  # Use the guaranteed unique email
            "password_hash": pwd_context.hash(PASSWORD),
            "first_name": first_name,
            "last_name": last_name,
            "company_name": company,
            "title": title,
            "bio": bio[:500],  # Ensure bio fits in field
            "image_url": f"https://api.dicebear.com/7.x/avataaars/svg?seed={first_name}{last_name}",
            "social_links": social_links,
            "is_active": True,
            "email_verified": True,  # All manually verified to avoid bounce
        })
    
    return users


def generate_organizations() -> List[Dict[str, Any]]:
    """Generate multiple organizations"""
    return [
        {
            "id": 1,
            "name": "Atria Events",
            "created_at": datetime.utcnow() - timedelta(days=365),
        },
        {
            "id": 2,
            "name": "TechConf Global",
            "created_at": datetime.utcnow() - timedelta(days=200),
        },
        {
            "id": 3,
            "name": "Developer Summit Org",
            "created_at": datetime.utcnow() - timedelta(days=100),
        }
    ]


def generate_organization_users() -> List[Dict[str, Any]]:
    """Assign users to organizations with appropriate roles"""
    org_users = []
    
    # Org 1 - Atria Events (our main org)
    org_users.append({"organization_id": 1, "user_id": 1, "role": "OWNER"})  # Demo user as owner
    org_users.append({"organization_id": 1, "user_id": 8, "role": "ADMIN"})
    org_users.append({"organization_id": 1, "user_id": 15, "role": "ADMIN"})
    org_users.append({"organization_id": 1, "user_id": 22, "role": "MEMBER"})
    
    # Org 2 - TechConf Global
    org_users.append({"organization_id": 2, "user_id": 25, "role": "OWNER"})
    org_users.append({"organization_id": 2, "user_id": 26, "role": "ADMIN"})
    org_users.append({"organization_id": 2, "user_id": 27, "role": "MEMBER"})
    
    # Org 3 - Developer Summit Org
    org_users.append({"organization_id": 3, "user_id": 30, "role": "OWNER"})
    org_users.append({"organization_id": 3, "user_id": 31, "role": "ADMIN"})
    
    return org_users


def generate_events() -> List[Dict[str, Any]]:
    """Generate 3 events with different sizes and characteristics"""
    events = []
    
    # Event 1 - Large conference with 75 attendees (our main demo event)
    events.append({
        "id": 1,
        "organization_id": 1,
        "title": "Atria TechConf 2025",
        "description": "The premier technology conference bringing together industry leaders, innovators, and developers for three days of learning, networking, and inspiration.",
        "hero_description": "Join 500+ developers, engineers, and tech leaders for the most comprehensive tech conference of 2025",
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
        "company_name": "Atria Events",
        "slug": "atria-techconf-2025",
        "status": "PUBLISHED",
        "branding": {
            "primary_color": "#0066ff",
            "secondary_color": "#ffffff",
            "logo_url": None,
            "banner_url": None,
        },
        "icebreakers": [
            "Hi! I noticed we're both interested in similar sessions. Would you like to connect?",
            "Hello! I saw your profile and would love to discuss our shared interests in technology.",
            "Great to meet another developer here! What brings you to TechConf 2025?",
            "I'm interested in learning more about your work at {company}. Could we chat?",
            "Your experience with {technology} sounds fascinating. Would love to hear more!",
            "Hi there! I'm building my network in the tech community. Would you like to connect?",
            "I enjoyed your question during the session. Want to discuss it further?",
            "Fellow engineer here! What sessions are you most excited about?",
            "I see we both work in similar domains. Would love to exchange ideas!",
            "Your bio mentions {interest} - I'm passionate about that too! Let's connect?"
        ],
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
            }
        ],
        "sections": {
            "welcome": {
                "title": "Welcome to Atria TechConf 2025",
                "content": "Join us for three days of cutting-edge technology discussions, hands-on workshops, and unparalleled networking opportunities with tech leaders from around the world.",
            },
            "highlights": [
                {
                    "title": "75+ Industry Speakers",
                    "description": "Learn from tech leaders at Netflix, Stripe, GitHub, Google, and more",
                    "icon": "speakers-icon",
                },
                {
                    "title": "30+ Technical Sessions",
                    "description": "Deep dives into cloud, AI, security, and emerging technologies",
                    "icon": "sessions-icon",
                },
                {
                    "title": "Hands-on Workshops",
                    "description": "Interactive sessions on React, Kubernetes, Machine Learning, and more",
                    "icon": "workshop-icon",
                },
                {
                    "title": "Networking Opportunities",
                    "description": "Connect with 500+ developers and tech leaders",
                    "icon": "network-icon",
                }
            ],
            "faqs": [
                {
                    "question": "Is there a virtual attendance option?",
                    "answer": "Yes, all sessions will be streamed live for virtual attendees with interactive Q&A"
                },
                {
                    "question": "Will sessions be recorded?",
                    "answer": "Yes, all sessions will be available on-demand for 30 days after the event"
                },
                {
                    "question": "What's included with registration?",
                    "answer": "Access to all sessions, workshops, networking events, and conference materials"
                },
                {
                    "question": "Are meals provided?",
                    "answer": "Yes, breakfast, lunch, and refreshments are included all three days"
                }
            ]
        }
    })
    
    # Event 2 - Medium-sized virtual conference
    events.append({
        "id": 2,
        "organization_id": 2,
        "title": "Cloud Native Summit 2025",
        "description": "A focused conference on cloud-native technologies, Kubernetes, and modern infrastructure",
        "hero_description": "Deep dive into cloud-native technologies with experts from leading cloud platforms",
        "hero_images": {
            "desktop": None,
            "mobile": None,
        },
        "event_type": "CONFERENCE",
        "event_format": "VIRTUAL",
        "is_private": False,
        "venue_name": None,
        "venue_address": None,
        "venue_city": None,
        "venue_country": None,
        "start_date": date(2025, 4, 10),
        "end_date": date(2025, 4, 11),
        "company_name": "TechConf Global",
        "slug": "cloud-native-summit-2025",
        "status": "PUBLISHED",
        "branding": {
            "primary_color": "#00a86b",
            "secondary_color": "#ffffff",
            "logo_url": None,
            "banner_url": None,
        },
        "icebreakers": [
            "Hi! What brings you to Cloud Native Summit?",
            "Fellow cloud engineer here! What's your tech stack?",
            "Interested in discussing Kubernetes best practices?",
            "Would love to hear about your cloud journey!",
            "Let's connect and share cloud experiences!"
        ],
        "sponsor_tiers": None,
        "sections": {
            "welcome": {
                "title": "Welcome to Cloud Native Summit",
                "content": "Two days of deep technical content on Kubernetes, service mesh, and cloud-native development",
            },
            "highlights": [],
            "faqs": []
        }
    })
    
    # Event 3 - Small workshop event
    events.append({
        "id": 3,
        "organization_id": 3,
        "title": "AI/ML Workshop Series",
        "description": "Hands-on workshops covering practical machine learning applications",
        "hero_description": "Learn practical ML skills through hands-on workshops",
        "hero_images": {
            "desktop": None,
            "mobile": None,
        },
        "event_type": "SINGLE_SESSION",
        "event_format": "HYBRID",
        "is_private": True,
        "venue_name": "Tech Hub Seattle",
        "venue_address": "123 Tech Street",
        "venue_city": "Seattle",
        "venue_country": "United States",
        "start_date": date(2025, 5, 20),
        "end_date": date(2025, 5, 20),
        "company_name": "Developer Summit Org",
        "slug": "ai-ml-workshop-2025",
        "status": "DRAFT",
        "branding": {
            "primary_color": "#ff6b6b",
            "secondary_color": "#ffffff",
            "logo_url": None,
            "banner_url": None,
        },
        "icebreakers": [
            "Hi! What ML projects are you working on?",
            "Would love to discuss AI applications!",
            "Let's connect and share ML insights!"
        ],
        "sponsor_tiers": None,
        "sections": {
            "welcome": {
                "title": "AI/ML Workshop Series",
                "content": "Practical, hands-on machine learning training",
            },
            "highlights": [],
            "faqs": []
        }
    })
    
    return events


def generate_event_users() -> List[Dict[str, Any]]:
    """Assign users to events with appropriate roles"""
    event_users = []
    
    # Event 1 - Large conference (75 attendees)
    # Demo user is admin
    event_users.append({
        "event_id": 1,
        "user_id": 1,
        "role": "ADMIN",
        "speaker_title": "Platform Lead @ Atria",
        "speaker_bio": "Leading the development of the Atria event management platform",
    })
    
    # Organizers (users 8, 15, 22)
    organizer_ids = [8, 15, 22]
    for user_id in organizer_ids:
        event_users.append({
            "event_id": 1,
            "user_id": user_id,
            "role": "ORGANIZER",
            "speaker_title": None,
            "speaker_bio": None,
        })
    
    # Speakers (users 2-7, 10-14)
    speaker_ids = list(range(2, 8)) + list(range(10, 15))
    for user_id in speaker_ids:
        event_users.append({
            "event_id": 1,
            "user_id": user_id,
            "role": "SPEAKER",
            "speaker_title": f"Speaker",  # Will be updated with actual title
            "speaker_bio": f"Technical expert and conference speaker",
        })
    
    # Regular attendees (remaining users up to 75, excluding those with other roles)
    # Exclude users who already have roles: 1 (admin), 8,15,22 (organizers), 2-7,10-14 (speakers)
    assigned_users = {1} | set(organizer_ids) | set(speaker_ids)
    attendee_ids = [uid for uid in range(16, 76) if uid not in assigned_users]
    for user_id in attendee_ids:
        event_users.append({
            "event_id": 1,
            "user_id": user_id,
            "role": "ATTENDEE",
            "speaker_title": None,
            "speaker_bio": None,
        })
    
    # Event 2 - Medium conference (20 attendees)
    # Owner of org 2 is admin
    event_users.append({
        "event_id": 2,
        "user_id": 25,
        "role": "ADMIN",
        "speaker_title": None,
        "speaker_bio": None,
    })
    
    # Some speakers
    for user_id in [26, 27, 28, 29]:
        event_users.append({
            "event_id": 2,
            "user_id": user_id,
            "role": "SPEAKER",
            "speaker_title": "Cloud Expert",
            "speaker_bio": "Specializing in cloud-native technologies",
        })
    
    # Some attendees (avoid overlap with Event 3)
    for user_id in range(45, 60):  # Users 45-59 (15 attendees)
        event_users.append({
            "event_id": 2,
            "user_id": user_id,
            "role": "ATTENDEE",
            "speaker_title": None,
            "speaker_bio": None,
        })
    
    # Event 3 - Small workshop (8 attendees)
    event_users.append({
        "event_id": 3,
        "user_id": 30,
        "role": "ADMIN",
        "speaker_title": None,
        "speaker_bio": None,
    })
    
    # Workshop instructor
    event_users.append({
        "event_id": 3,
        "user_id": 31,
        "role": "SPEAKER",
        "speaker_title": "ML Engineer",
        "speaker_bio": "Machine learning practitioner and educator",
    })
    
    # Workshop attendees (avoid overlap with Event 2)
    for user_id in range(32, 38):  # Users 32-37 (6 attendees)
        event_users.append({
            "event_id": 3,
            "user_id": user_id,
            "role": "ATTENDEE",
            "speaker_title": None,
            "speaker_bio": None,
        })
    
    return event_users


def generate_sessions_old() -> List[Dict[str, Any]]:
    """Generate sessions for events"""
    sessions = []
    session_id = 1
    
    # Event 1 - Full conference schedule (3 days)
    # Day 1 - March 15 - Opening Day
    sessions.extend([
        {
            "id": session_id,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "KEYNOTE",
            "title": "Opening Keynote: The Future of Software Development",
            "short_description": "Vision for the next decade of software engineering",
            "description": "Join us for an inspiring keynote on how AI, quantum computing, and new paradigms will reshape software development",
            "start_time": time(9, 0),
            "end_time": time(10, 0),
            "stream_url": "https://stream.atria.com/keynote1",
            "day_number": 1,
        },
        {
            "id": session_id + 1,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "PRESENTATION",
            "title": "Building Scalable Microservices",
            "short_description": "Patterns and practices for microservice architecture",
            "description": "Learn proven patterns for building and managing microservices at scale",
            "start_time": time(10, 30),
            "end_time": time(11, 30),
            "stream_url": "https://stream.atria.com/track1-1",
            "day_number": 1,
        },
        {
            "id": session_id + 2,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "WORKSHOP",
            "title": "Hands-on Kubernetes Workshop",
            "short_description": "Deploy and manage applications on Kubernetes",
            "description": "Practical workshop covering Kubernetes fundamentals through advanced topics",
            "start_time": time(10, 30),
            "end_time": time(12, 30),
            "stream_url": "https://stream.atria.com/workshop1",
            "day_number": 1,
        },
        {
            "id": session_id + 3,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "NETWORKING",
            "title": "Lunch & Networking",
            "short_description": "Connect with fellow attendees",
            "description": "Structured networking lunch with topic-based tables",
            "start_time": time(12, 30),
            "end_time": time(14, 0),
            "stream_url": None,
            "day_number": 1,
        },
        {
            "id": session_id + 4,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "PANEL",
            "title": "The Future of AI in Production",
            "short_description": "Industry leaders discuss AI deployment challenges",
            "description": "Panel discussion on deploying and managing AI systems in production environments",
            "start_time": time(14, 0),
            "end_time": time(15, 30),
            "stream_url": "https://stream.atria.com/panel1",
            "day_number": 1,
        }
    ])
    
    session_id += 5
    
    # Day 2 - March 16
    sessions.extend([
        {
            "id": session_id,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "KEYNOTE",
            "title": "Security in the Age of AI",
            "short_description": "Navigating security challenges in AI-driven systems",
            "description": "Exploring the intersection of AI and cybersecurity",
            "start_time": time(9, 0),
            "end_time": time(10, 0),
            "stream_url": "https://stream.atria.com/keynote2",
            "day_number": 2,
        },
        {
            "id": session_id + 1,
            "event_id": 1,
            "status": "SCHEDULED",
            "session_type": "PRESENTATION",
            "title": "React Performance at Scale",
            "short_description": "Optimizing React applications for millions of users",
            "description": "Deep dive into React performance optimization techniques used at Netflix",
            "start_time": time(10, 30),
            "end_time": time(11, 30),
            "stream_url": "https://stream.atria.com/track2-1",
            "day_number": 2,
        }
    ])
    
    session_id += 2
    
    # Event 2 - Cloud Native Summit sessions
    sessions.extend([
        {
            "id": session_id,
            "event_id": 2,
            "status": "SCHEDULED",
            "session_type": "KEYNOTE",
            "title": "Cloud Native Architecture Patterns",
            "short_description": "Modern patterns for cloud-native applications",
            "description": "Comprehensive overview of cloud-native design patterns",
            "start_time": time(9, 0),
            "end_time": time(10, 0),
            "stream_url": "https://stream.cloud.com/keynote",
            "day_number": 1,
        },
        {
            "id": session_id + 1,
            "event_id": 2,
            "status": "SCHEDULED",
            "session_type": "WORKSHOP",
            "title": "Service Mesh Deep Dive",
            "short_description": "Implementing service mesh with Istio",
            "description": "Hands-on workshop on service mesh implementation",
            "start_time": time(10, 30),
            "end_time": time(12, 0),
            "stream_url": "https://stream.cloud.com/workshop",
            "day_number": 1,
        }
    ])
    
    session_id += 2
    
    # Event 3 - AI/ML Workshop
    sessions.append({
        "id": session_id,
        "event_id": 3,
        "status": "SCHEDULED",
        "session_type": "WORKSHOP",
        "title": "Practical Machine Learning with Python",
        "short_description": "Hands-on ML model development",
        "description": "Build and deploy ML models using scikit-learn and TensorFlow",
        "start_time": time(9, 0),
        "end_time": time(17, 0),
        "stream_url": None,
        "day_number": 1,
    })
    
    return sessions


def generate_sessions() -> List[Dict[str, Any]]:
    """Use enhanced session generation"""
    return generate_enhanced_sessions()


def generate_session_speakers() -> List[Dict[str, Any]]:
    """Assign speakers to sessions"""
    speakers = []
    
    # Event 1 sessions
    # Session 1 - Opening Keynote (Demo User)
    speakers.append({
        "session_id": 1,
        "user_id": 1,
        "role": "KEYNOTE",
        "order": 1,
    })
    
    # Session 2 - Microservices (User 2)
    speakers.append({
        "session_id": 2,
        "user_id": 2,
        "role": "SPEAKER",
        "order": 1,
    })
    
    # Session 3 - Kubernetes Workshop (Users 3, 4)
    speakers.extend([
        {
            "session_id": 3,
            "user_id": 3,
            "role": "SPEAKER",
            "order": 1,
        },
        {
            "session_id": 3,
            "user_id": 4,
            "role": "SPEAKER",
            "order": 2,
        }
    ])
    
    # Session 5 - AI Panel (Users 5, 6, 7, 10, 11 as panelists, 12 as moderator)
    speakers.append({
        "session_id": 5,
        "user_id": 12,
        "role": "MODERATOR",
        "order": 1,
    })
    
    for i, user_id in enumerate([5, 6, 7, 10, 11], start=2):
        speakers.append({
            "session_id": 5,
            "user_id": user_id,
            "role": "PANELIST",
            "order": i,
        })
    
    # Event 2 sessions
    speakers.extend([
        {
            "session_id": 8,
            "user_id": 26,
            "role": "KEYNOTE",
            "order": 1,
        },
        {
            "session_id": 9,
            "user_id": 27,
            "role": "SPEAKER",
            "order": 1,
        }
    ])
    
    # Event 3 session
    speakers.append({
        "session_id": 10,
        "user_id": 31,
        "role": "SPEAKER",
        "order": 1,
    })
    
    return speakers


def generate_chat_rooms() -> List[Dict[str, Any]]:
    """Generate chat rooms with proper permissions"""
    chat_rooms = []
    room_id = 1
    
    # Event 1 - Global rooms
    chat_rooms.extend([
        {
            "id": room_id,
            "event_id": 1,
            "session_id": None,
            "name": "General Chat",
            "description": "Main event discussion for all attendees",
            "room_type": "GLOBAL",
            "is_enabled": True,
            "display_order": 1.0,
        },
        {
            "id": room_id + 1,
            "event_id": 1,
            "session_id": None,
            "name": "Green Room",
            "description": "Speakers and organizers only",
            "room_type": "GREEN_ROOM",
            "is_enabled": True,
            "display_order": 2.0,
        },
        {
            "id": room_id + 2,
            "event_id": 1,
            "session_id": None,
            "name": "Admin Chat",
            "description": "Event admins and organizers only",
            "room_type": "ADMIN",
            "is_enabled": True,
            "display_order": 3.0,
        }
    ])
    
    room_id += 3
    
    # Event 1 - Session-specific rooms (for first 5 sessions)
    for session_id in range(1, 6):
        if session_id != 4:  # Skip networking session
            chat_rooms.extend([
                {
                    "id": room_id,
                    "event_id": 1,
                    "session_id": session_id,
                    "name": f"Session {session_id} Chat",
                    "description": "Public discussion for this session",
                    "room_type": "PUBLIC",
                    "is_enabled": True,
                    "display_order": float(session_id),
                },
                {
                    "id": room_id + 1,
                    "event_id": 1,
                    "session_id": session_id,
                    "name": f"Session {session_id} Backstage",
                    "description": "Speakers and organizers only",
                    "room_type": "BACKSTAGE",
                    "is_enabled": True,
                    "display_order": float(session_id) + 0.5,
                }
            ])
            room_id += 2
    
    # Event 2 - Basic rooms
    chat_rooms.extend([
        {
            "id": room_id,
            "event_id": 2,
            "session_id": None,
            "name": "General Discussion",
            "description": "Main event chat",
            "room_type": "GLOBAL",
            "is_enabled": True,
            "display_order": 1.0,
        },
        {
            "id": room_id + 1,
            "event_id": 2,
            "session_id": None,
            "name": "Speakers Lounge",
            "description": "Speaker coordination",
            "room_type": "GREEN_ROOM",
            "is_enabled": True,
            "display_order": 2.0,
        }
    ])
    
    room_id += 2
    
    # Event 3 - Single room
    chat_rooms.append({
        "id": room_id,
        "event_id": 3,
        "session_id": None,
        "name": "Workshop Chat",
        "description": "Workshop discussion",
        "room_type": "GLOBAL",
        "is_enabled": True,
        "display_order": 1.0,
    })
    
    return chat_rooms


def generate_chat_messages_old() -> List[Dict[str, Any]]:
    """Generate sample chat messages"""
    messages = []
    message_id = 1
    
    # Event 1 - General Chat messages
    general_chat_messages = [
        (1, "Welcome everyone to Atria TechConf 2025! So excited to have you all here!"),
        (15, "Looking forward to the keynote! Anyone else attending in person?"),
        (20, "I'll be there! Coming from Seattle. Where's everyone traveling from?"),
        (25, "Virtual attendee here from London! Love that there's a hybrid option"),
        (30, "The speaker lineup looks amazing. Can't wait for the React performance talk"),
        (35, "Same! I'm also interested in the Kubernetes workshop. Who's joining that?"),
        (40, "I'll be in the K8s workshop! Been wanting to level up my container orchestration skills"),
        (1, "Remember to check out the networking lunch - we have topic tables for different interests!"),
        (45, "Quick question - will the sessions be recorded for later viewing?"),
        (8, "Yes! All sessions will be available on-demand for 30 days after the event"),
    ]
    
    for user_id, content in general_chat_messages:
        messages.append({
            "id": message_id,
            "room_id": 1,  # General Chat for Event 1
            "user_id": user_id,
            "content": content,
        })
        message_id += 1
    
    # Event 1 - Green Room messages (speakers/organizers only)
    green_room_messages = [
        (1, "Welcome speakers! This is our private channel for coordination"),
        (2, "Thanks for having us! My flight just landed. See everyone tomorrow morning"),
        (3, "Hi all! Looking forward to the workshop. We have 30 registered so far"),
        (8, "Great! AV team will be ready 30 min before each session for mic checks"),
        (5, "Perfect. What time should panelists arrive for the AI discussion?"),
        (12, "Let's meet 15 minutes early to go over the questions"),
    ]
    
    for user_id, content in green_room_messages:
        messages.append({
            "id": message_id,
            "room_id": 2,  # Green Room for Event 1
            "user_id": user_id,
            "content": content,
        })
        message_id += 1
    
    # Event 1 - Admin Chat messages
    admin_messages = [
        (1, "Admin team - everything looking good for tomorrow?"),
        (8, "Registration desk is set up. We have 380 confirmed in-person attendees"),
        (15, "Catering confirmed for all three days. Special dietary needs accommodated"),
        (22, "Sponsor booths are ready. Platinum sponsors have prime locations as promised"),
        (1, "Excellent work everyone! Let's make this the best TechConf yet"),
    ]
    
    for user_id, content in admin_messages:
        messages.append({
            "id": message_id,
            "room_id": 3,  # Admin Chat for Event 1
            "user_id": user_id,
            "content": content,
        })
        message_id += 1
    
    # Session 1 Public Chat
    session_messages = [
        (16, "Excited for the opening keynote!"),
        (25, "The future of AI in development - this should be interesting"),
        (30, "Anyone have questions ready for the Q&A?"),
    ]
    
    for user_id, content in session_messages:
        messages.append({
            "id": message_id,
            "room_id": 4,  # Session 1 Public Chat
            "user_id": user_id,
            "content": content,
        })
        message_id += 1
    
    # Session 1 Backstage
    backstage_messages = [
        (1, "Mic check complete. Ready to go!"),
        (8, "Slides are loaded and streaming is live"),
        (1, "Thanks team! Here we go!"),
    ]
    
    for user_id, content in backstage_messages:
        messages.append({
            "id": message_id,
            "room_id": 5,  # Session 1 Backstage
            "user_id": user_id,
            "content": content,
        })
        message_id += 1
    
    return messages


def generate_chat_messages() -> List[Dict[str, Any]]:
    """Use enhanced chat message generation"""
    return generate_enhanced_chat_messages()


def generate_connections() -> List[Dict[str, Any]]:
    """Generate connections between users with various states"""
    connections = []
    connection_id = 1
    
    # Demo user connections (mix of accepted and pending)
    # Accepted connections
    accepted_connections = [
        (1, 2, "Hi Sarah! I'd love to connect and discuss distributed systems."),
        (1, 3, "Great to meet another platform engineer! Let's connect."),
        (1, 8, "Thanks for helping organize this amazing event!"),
        (15, 1, "Demo User, your platform work is inspiring! Would love to connect."),
        (20, 1, "Hi! I'm interested in learning more about the Atria platform."),
    ]
    
    for requester, recipient, message in accepted_connections:
        connections.append({
            "id": connection_id,
            "requester_id": requester,
            "recipient_id": recipient,
            "status": "ACCEPTED",
            "icebreaker_message": message,
            "originating_event_id": 1,
        })
        connection_id += 1
    
    # Pending connections (waiting for demo user response)
    pending_to_demo = [
        (25, 1, "Hi Demo User! Would love to discuss event management platforms."),
        (30, 1, "Your keynote topic sounds fascinating! Can we connect?"),
        (35, 1, "I'm building a similar platform. Would appreciate your insights!"),
    ]
    
    for requester, recipient, message in pending_to_demo:
        connections.append({
            "id": connection_id,
            "requester_id": requester,
            "recipient_id": recipient,
            "status": "PENDING",
            "icebreaker_message": message,
            "originating_event_id": 1,
        })
        connection_id += 1
    
    # Pending connections from demo user
    pending_from_demo = [
        (1, 40, "Hi! Noticed you work in a similar space. Let's connect!"),
        (1, 45, "Would love to hear about your experience with microservices."),
    ]
    
    for requester, recipient, message in pending_from_demo:
        connections.append({
            "id": connection_id,
            "requester_id": requester,
            "recipient_id": recipient,
            "status": "PENDING",
            "icebreaker_message": message,
            "originating_event_id": 1,
        })
        connection_id += 1
    
    # Other user connections (to make it realistic)
    other_connections = [
        (2, 3, "ACCEPTED", "Fellow speaker! Looking forward to your session."),
        (2, 4, "ACCEPTED", "GitHub and Netflix collaboration! Let's connect."),
        (5, 6, "ACCEPTED", "Great questions during the panel. Let's stay in touch!"),
        (10, 11, "PENDING", "Your ML work sounds interesting. Can we chat?"),
        (15, 20, "ACCEPTED", "Thanks for the great conversation at lunch!"),
        (25, 30, "PENDING", "Would love to connect and share cloud experiences."),
        (35, 40, "ACCEPTED", "Great meeting you at the networking session!"),
        (45, 50, "PENDING", "Hi! I'm also interested in React performance."),
        (3, 10, "REJECTED", "Thanks, but I'm keeping my network focused for now."),
        (20, 25, "ACCEPTED", "Virtual networking for the win! Great to connect."),
    ]
    
    for requester, recipient, status, message in other_connections:
        connections.append({
            "id": connection_id,
            "requester_id": requester,
            "recipient_id": recipient,
            "status": status,
            "icebreaker_message": message,
            "originating_event_id": 1 if requester <= 75 and recipient <= 75 else 2,
        })
        connection_id += 1
    
    return connections


def generate_direct_message_threads() -> List[Dict[str, Any]]:
    """Generate DM threads between connected users"""
    threads = []
    
    # Threads for demo user's accepted connections
    threads.extend([
        {"id": 1, "user1_id": 1, "user2_id": 2, "is_encrypted": False},
        {"id": 2, "user1_id": 1, "user2_id": 3, "is_encrypted": False},
        {"id": 3, "user1_id": 1, "user2_id": 8, "is_encrypted": False},
        {"id": 4, "user1_id": 1, "user2_id": 15, "is_encrypted": False},
        {"id": 5, "user1_id": 1, "user2_id": 20, "is_encrypted": False},
    ])
    
    # Other user threads
    threads.extend([
        {"id": 6, "user1_id": 2, "user2_id": 3, "is_encrypted": False},
        {"id": 7, "user1_id": 2, "user2_id": 4, "is_encrypted": False},
        {"id": 8, "user1_id": 5, "user2_id": 6, "is_encrypted": False},
        {"id": 9, "user1_id": 15, "user2_id": 20, "is_encrypted": False},
        {"id": 10, "user1_id": 35, "user2_id": 40, "is_encrypted": False},
    ])
    
    return threads


def generate_direct_messages_old() -> List[Dict[str, Any]]:
    """Generate DM conversations"""
    messages = []
    message_id = 1
    
    # Thread 1: Demo User <-> Sarah Chen
    thread1_messages = [
        (1, 2, "Hi Sarah! Thanks for accepting my connection request."),
        (2, 1, "Happy to connect! Your work on the Atria platform looks impressive."),
        (1, 2, "Thank you! I saw you're speaking about distributed systems. What will you cover?"),
        (2, 1, "I'll be discussing patterns we use at Netflix for handling millions of concurrent users."),
        (1, 2, "That sounds fascinating! Looking forward to your session."),
    ]
    
    for sender, recipient, content in thread1_messages:
        messages.append({
            "id": message_id,
            "thread_id": 1,
            "sender_id": sender,
            "content": content,
            "encrypted_content": None,
            "status": "READ",
        })
        message_id += 1
    
    # Thread 2: Demo User <-> Marcus Rodriguez
    thread2_messages = [
        (3, 1, "Thanks for connecting! Excited about the conference."),
        (1, 3, "Me too! Your Kubernetes workshop looks great."),
        (3, 1, "We'll cover a lot of practical examples. Bring your laptop!"),
        (1, 3, "Will do! Any prerequisites I should review?"),
        (3, 1, "Basic Docker knowledge would be helpful, but we'll cover the fundamentals."),
    ]
    
    for sender, recipient, content in thread2_messages:
        # Determine correct recipient for thread lookup
        if sender == 1:
            thread_user2 = 3
        else:
            thread_user2 = 1
        
        messages.append({
            "id": message_id,
            "thread_id": 2,
            "sender_id": sender,
            "content": content,
            "encrypted_content": None,
            "status": "READ" if message_id < 8 else "DELIVERED",
        })
        message_id += 1
    
    # Thread 3: Demo User <-> Chris Martinez (Organizer)
    thread3_messages = [
        (8, 1, "Hey! Everything ready for your keynote?"),
        (1, 8, "Yes! Just finished the final slides. Thanks for checking in."),
        (8, 1, "Perfect. AV team will be ready 30 min early for setup."),
        (1, 8, "Great, I'll be there. How's registration looking?"),
        (8, 1, "We're at 380 in-person and 200+ virtual. Great turnout!"),
        (1, 8, "That's amazing! This is going to be a great event."),
    ]
    
    for sender, recipient, content in thread3_messages:
        messages.append({
            "id": message_id,
            "thread_id": 3,
            "sender_id": sender,
            "content": content,
            "encrypted_content": None,
            "status": "READ",
        })
        message_id += 1
    
    # Some unread messages in thread 4
    thread4_messages = [
        (15, 1, "Hi! Quick question about the platform."),
        (1, 15, "Sure, happy to help! What would you like to know?"),
        (15, 1, "Is Atria open source or available for licensing?"),
        (15, 1, "We're considering it for our internal events."),
    ]
    
    for sender, recipient, content in thread4_messages:
        messages.append({
            "id": message_id,
            "thread_id": 4,
            "sender_id": sender,
            "content": content,
            "encrypted_content": None,
            "status": "READ" if message_id < 18 else "SENT",
        })
        message_id += 1
    
    return messages


def generate_direct_messages() -> List[Dict[str, Any]]:
    """Use long DM conversations for pagination testing"""
    return generate_long_dm_conversations()


def generate_sponsors() -> List[Dict[str, Any]]:
    """Generate event sponsors"""
    sponsors = []
    
    # Event 1 sponsors
    sponsors.extend([
        {
            "id": 1,
            "event_id": 1,
            "name": "CloudTech Solutions",
            "description": "Leading cloud infrastructure provider",
            "website_url": "https://cloudtech.example.com",
            "logo_url": "https://via.placeholder.com/200x100/0066ff/ffffff?text=CloudTech",
            "tier_id": "platinum",
            "display_order": 1,
            "is_active": True,
            "featured": True,
            "social_links": {
                "twitter": "https://twitter.com/cloudtech",
                "linkedin": "https://linkedin.com/company/cloudtech"
            },
        },
        {
            "id": 2,
            "event_id": 1,
            "name": "DevTools Pro",
            "description": "Developer productivity tools",
            "website_url": "https://devtools.example.com",
            "logo_url": "https://via.placeholder.com/200x100/ffd700/000000?text=DevTools",
            "tier_id": "gold",
            "display_order": 2,
            "is_active": True,
            "featured": True,
            "social_links": {
                "twitter": "https://twitter.com/devtools"
            },
        },
        {
            "id": 3,
            "event_id": 1,
            "name": "API Gateway Inc",
            "description": "API management and security",
            "website_url": "https://apigateway.example.com",
            "logo_url": "https://via.placeholder.com/200x100/c0c0c0/000000?text=API+Gateway",
            "tier_id": "silver",
            "display_order": 3,
            "is_active": True,
            "featured": False,
            "social_links": {},
        },
    ])
    
    return sponsors


def generate_user_encryption_keys() -> List[Dict[str, Any]]:
    """Generate encryption keys for users (placeholder for now)"""
    # Not implementing real encryption for demo
    return []


# Export all generation functions
__all__ = [
    'generate_users',
    'generate_organizations',
    'generate_organization_users',
    'generate_events',
    'generate_event_users',
    'generate_sessions',
    'generate_session_speakers',
    'generate_chat_rooms',
    'generate_chat_messages',
    'generate_connections',
    'generate_direct_message_threads',
    'generate_direct_messages',
    'generate_sponsors',
    'generate_user_encryption_keys',
]
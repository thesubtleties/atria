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
    """Generate 150+ users with varied roles and companies"""
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
    
    for i in range(2, 152):  # Generate 150 additional users + demo user = 151 total
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
    """Generate 6 events with different sizes and characteristics (August 2025 - February 2026)"""
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
        "start_date": date(2025, 9, 15),
        "end_date": date(2025, 9, 17),
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
        "start_date": date(2025, 10, 22),
        "end_date": date(2025, 10, 22),
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
        "start_date": date(2025, 11, 14),
        "end_date": date(2025, 11, 14),
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
    
    # Event 4 - Frontend Masters Conference - December 2025
    events.append({
        "id": 4,
        "organization_id": 1,
        "title": "Frontend Masters Conference 2025",
        "description": "The premier frontend development conference covering React, TypeScript, and modern web technologies",
        "hero_description": "Two days of cutting-edge frontend development insights from industry leaders",
        "hero_images": {
            "desktop": None,
            "mobile": None,
        },
        "event_type": "CONFERENCE",
        "event_format": "HYBRID",
        "is_private": False,
        "venue_name": "Austin Convention Center",
        "venue_address": "500 E Cesar Chavez St",
        "venue_city": "Austin",
        "venue_country": "United States",
        "start_date": date(2025, 12, 5),
        "end_date": date(2025, 12, 6),
        "company_name": "Frontend Masters",
        "slug": "frontend-masters-conf-2025",
        "status": "PUBLISHED",
        "branding": {
            "primary_color": "#c02d28",
            "secondary_color": "#ffffff",
            "logo_url": None,
            "banner_url": None,
        },
        "icebreakers": [
            "Hi! What's your favorite frontend framework?",
            "Fellow frontend developer here! What are you building?",
            "Would love to discuss modern CSS techniques!",
            "Interested in the latest React patterns?",
            "Let's connect and share frontend experiences!"
        ],
        "sponsor_tiers": None,
        "sections": {
            "welcome": {
                "title": "Welcome to Frontend Masters Conference",
                "content": "Join the premier frontend development conference featuring the latest in React, TypeScript, and web technologies",
            },
            "highlights": [],
            "faqs": []
        }
    })
    
    # Event 5 - DevOps & Security Summit - January 2026
    events.append({
        "id": 5,
        "organization_id": 1,
        "title": "DevOps & Security Summit 2026",
        "description": "Platform engineering, GitOps, and modern security practices for the cloud-native era",
        "hero_description": "Advance your DevOps and security skills with industry experts",
        "hero_images": {
            "desktop": None,
            "mobile": None,
        },
        "event_type": "CONFERENCE",
        "event_format": "HYBRID",
        "is_private": False,
        "venue_name": "Seattle Convention Center",
        "venue_address": "705 Pike Street",
        "venue_city": "Seattle",
        "venue_country": "United States",
        "start_date": date(2026, 1, 20),
        "end_date": date(2026, 1, 21),
        "company_name": "DevSecOps Alliance",
        "slug": "devops-security-summit-2026",
        "status": "PUBLISHED",
        "branding": {
            "primary_color": "#2f4858",
            "secondary_color": "#ffffff",
            "logo_url": None,
            "banner_url": None,
        },
        "icebreakers": [
            "Hi! What's your DevOps toolchain?",
            "Fellow DevOps engineer here! How's your security posture?",
            "Interested in discussing platform engineering?",
            "Would love to share Kubernetes experiences!",
            "Let's connect and talk about modern infrastructure!"
        ],
        "sponsor_tiers": None,
        "sections": {
            "welcome": {
                "title": "Welcome to DevOps & Security Summit",
                "content": "Explore the future of DevOps and security with platform engineering and zero-trust practices",
            },
            "highlights": [],
            "faqs": []
        }
    })
    
    # Event 6 - Data & AI Conference - February 2026
    events.append({
        "id": 6,
        "organization_id": 1,
        "title": "Data & AI Conference 2026",
        "description": "Data engineering, machine learning, and artificial intelligence for modern applications",
        "hero_description": "Discover the latest in data science, AI, and machine learning from industry practitioners",
        "hero_images": {
            "desktop": None,
            "mobile": None,
        },
        "event_type": "CONFERENCE",
        "event_format": "HYBRID",
        "is_private": False,
        "venue_name": "Boston Convention Center",
        "venue_address": "415 Summer Street",
        "venue_city": "Boston",
        "venue_country": "United States",
        "start_date": date(2026, 2, 18),
        "end_date": date(2026, 2, 19),
        "company_name": "Data Science Society",
        "slug": "data-ai-conference-2026",
        "status": "PUBLISHED",
        "branding": {
            "primary_color": "#7c4dff",
            "secondary_color": "#ffffff",
            "logo_url": None,
            "banner_url": None,
        },
        "icebreakers": [
            "Hi! What data challenges are you solving?",
            "Fellow data engineer here! What's your stack?",
            "Interested in discussing ML pipelines?",
            "Would love to hear about your AI projects!",
            "Let's connect and share data science insights!"
        ],
        "sponsor_tiers": None,
        "sections": {
            "welcome": {
                "title": "Welcome to Data & AI Conference",
                "content": "Explore cutting-edge data engineering and AI technologies with industry leaders",
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
    attendee_ids = [uid for uid in range(16, 151) if uid not in assigned_users]
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
    for user_id in range(45, 80):  # Users 45-79 (35 attendees)
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
    for user_id in range(32, 45):  # Users 32-44 (13 attendees)
        event_users.append({
            "event_id": 3,
            "user_id": user_id,
            "role": "ATTENDEE",
            "speaker_title": None,
            "speaker_bio": None,
        })
    
    # Event 4 - Frontend Masters Conference (60 attendees)
    event_users.append({
        "event_id": 4,
        "user_id": 1,  # Demo user attends this too
        "role": "SPEAKER",
        "speaker_title": "Platform Architecture Lead",
        "speaker_bio": "Discussing modern frontend architectures and patterns",
    })
    
    # Frontend speakers
    for user_id in [80, 81, 82, 83, 84]:
        event_users.append({
            "event_id": 4,
            "user_id": user_id,
            "role": "SPEAKER",
            "speaker_title": "Frontend Expert",
            "speaker_bio": "Specializing in React, TypeScript, and modern web development",
        })
    
    # Frontend attendees
    for user_id in range(85, 140):  # 55 attendees
        event_users.append({
            "event_id": 4,
            "user_id": user_id,
            "role": "ATTENDEE",
            "speaker_title": None,
            "speaker_bio": None,
        })
    
    # Event 5 - DevOps & Security Summit (45 attendees)
    event_users.append({
        "event_id": 5,
        "user_id": 90,
        "role": "ADMIN",
        "speaker_title": None,
        "speaker_bio": None,
    })
    
    # DevOps speakers
    for user_id in [91, 92, 93, 94]:
        event_users.append({
            "event_id": 5,
            "user_id": user_id,
            "role": "SPEAKER",
            "speaker_title": "DevOps Specialist",
            "speaker_bio": "Expert in CI/CD, Kubernetes, and cloud infrastructure",
        })
    
    # DevOps attendees
    for user_id in range(95, 135):  # 40 attendees
        event_users.append({
            "event_id": 5,
            "user_id": user_id,
            "role": "ATTENDEE",
            "speaker_title": None,
            "speaker_bio": None,
        })
    
    # Event 6 - Data & AI Conference (50 attendees)
    event_users.append({
        "event_id": 6,
        "user_id": 100,
        "role": "ADMIN",
        "speaker_title": None,
        "speaker_bio": None,
    })
    
    # Data/AI speakers
    for user_id in [101, 102, 103, 104, 105]:
        event_users.append({
            "event_id": 6,
            "user_id": user_id,
            "role": "SPEAKER",
            "speaker_title": "Data/AI Expert",
            "speaker_bio": "Specializing in ML, data engineering, and AI applications",
        })
    
    # Data/AI attendees
    for user_id in range(106, 150):  # 44 attendees
        event_users.append({
            "event_id": 6,
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
    """Assign speakers to all sessions dynamically"""
    speakers = []
    
    # Import sessions to know what we're working with
    from .enhanced_sessions import generate_enhanced_sessions
    all_sessions = generate_enhanced_sessions()
    
    # Event 1 (sessions 1-45) - Main conference with varied speakers
    # Keynotes and special sessions
    speakers.append({"session_id": 1, "user_id": 1, "role": "KEYNOTE", "order": 1})  # Demo user opens
    speakers.append({"session_id": 2, "user_id": 2, "role": "SPEAKER", "order": 1})
    speakers.append({"session_id": 3, "user_id": 3, "role": "SPEAKER", "order": 1})
    speakers.append({"session_id": 3, "user_id": 4, "role": "SPEAKER", "order": 2})  # Workshop co-presenter
    
    # Panel session (session 5) with multiple panelists
    speakers.append({"session_id": 5, "user_id": 12, "role": "MODERATOR", "order": 1})
    for i, user_id in enumerate([5, 6, 7, 10, 11], start=2):
        speakers.append({"session_id": 5, "user_id": user_id, "role": "PANELIST", "order": i})
    
    # Assign speakers to remaining Event 1 sessions (6-45)
    speaker_pool_event1 = list(range(2, 25))  # Users who are speakers at Event 1
    for session_id in range(6, 46):
        session = next((s for s in all_sessions if s['id'] == session_id), None)
        if session and session['session_type'] != 'NETWORKING':
            # Assign 1-2 speakers per session
            num_speakers = 2 if session['session_type'] == 'WORKSHOP' else 1
            for order in range(1, num_speakers + 1):
                speaker_id = speaker_pool_event1[(session_id + order) % len(speaker_pool_event1)]
                role = "KEYNOTE" if session['session_type'] == 'KEYNOTE' else "SPEAKER"
                speakers.append({
                    "session_id": session_id,
                    "user_id": speaker_id,
                    "role": role,
                    "order": order
                })
    
    # Event 2 (sessions 46-53) - Cloud Native Summit
    speaker_pool_event2 = [26, 27, 28, 29]
    for session_id in range(46, 54):
        session = next((s for s in all_sessions if s['id'] == session_id), None)
        if session and session['session_type'] != 'NETWORKING':
            speaker_id = speaker_pool_event2[(session_id - 46) % len(speaker_pool_event2)]
            role = "KEYNOTE" if session['session_type'] == 'KEYNOTE' else "SPEAKER"
            speakers.append({
                "session_id": session_id,
                "user_id": speaker_id,
                "role": role,
                "order": 1
            })
    
    # Event 3 (session 54) - AI/ML Workshop
    speakers.append({"session_id": 54, "user_id": 31, "role": "SPEAKER", "order": 1})
    
    # Event 4 (sessions 55-66) - Frontend Masters Conference
    speaker_pool_event4 = [1, 80, 81, 82, 83, 84]  # Demo user speaks here too
    for session_id in range(55, 67):
        session = next((s for s in all_sessions if s['id'] == session_id), None)
        if session and session['session_type'] != 'NETWORKING':
            speaker_idx = (session_id - 55) % len(speaker_pool_event4)
            speaker_id = speaker_pool_event4[speaker_idx]
            role = "KEYNOTE" if session['session_type'] == 'KEYNOTE' else "SPEAKER"
            speakers.append({
                "session_id": session_id,
                "user_id": speaker_id,
                "role": role,
                "order": 1
            })
    
    # Event 5 (sessions 67-76) - DevOps & Security Summit
    speaker_pool_event5 = [91, 92, 93, 94]
    for session_id in range(67, 77):
        session = next((s for s in all_sessions if s['id'] == session_id), None)
        if session and session['session_type'] != 'NETWORKING':
            speaker_idx = (session_id - 67) % len(speaker_pool_event5)
            speaker_id = speaker_pool_event5[speaker_idx]
            role = "KEYNOTE" if session['session_type'] == 'KEYNOTE' else "SPEAKER"
            speakers.append({
                "session_id": session_id,
                "user_id": speaker_id,
                "role": role,
                "order": 1
            })
    
    # Event 6 (sessions 77-87) - Data & AI Conference
    speaker_pool_event6 = [101, 102, 103, 104, 105]
    for session_id in range(77, 88):
        session = next((s for s in all_sessions if s['id'] == session_id), None)
        if session and session['session_type'] != 'NETWORKING':
            speaker_idx = (session_id - 77) % len(speaker_pool_event6)
            speaker_id = speaker_pool_event6[speaker_idx]
            role = "KEYNOTE" if session['session_type'] == 'KEYNOTE' else "SPEAKER"
            speakers.append({
                "session_id": session_id,
                "user_id": speaker_id,
                "role": role,
                "order": 1
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
    
    # Create PUBLIC and BACKSTAGE rooms for ALL sessions from ALL events
    # Import the enhanced sessions data
    from .enhanced_sessions import generate_enhanced_sessions
    all_sessions = generate_enhanced_sessions()
    
    # Group sessions by event
    sessions_by_event = {}
    for session in all_sessions:
        event_id = session['event_id']
        if event_id not in sessions_by_event:
            sessions_by_event[event_id] = []
        sessions_by_event[event_id].append(session)
    
    # Create rooms for each session
    for event_id, sessions in sessions_by_event.items():
        for session in sessions:
            # Skip NETWORKING sessions as they don't need dedicated chat rooms
            if session['session_type'] != 'NETWORKING':
                # PUBLIC chat room
                chat_rooms.append({
                    "id": room_id,
                    "event_id": event_id,
                    "session_id": session['id'],
                    "name": f"{session['title'][:50]}... - Chat" if len(session['title']) > 50 else f"{session['title']} - Chat",
                    "description": f"Public discussion for {session['title']}",
                    "room_type": "PUBLIC",
                    "is_enabled": True,
                    "display_order": float(session['id']) * 2.0,
                })
                room_id += 1
                
                # BACKSTAGE chat room
                chat_rooms.append({
                    "id": room_id,
                    "event_id": event_id,
                    "session_id": session['id'],
                    "name": f"{session['title'][:50]}... - Backstage" if len(session['title']) > 50 else f"{session['title']} - Backstage",
                    "description": f"Speakers and organizers coordination for {session['title']}",
                    "room_type": "BACKSTAGE",
                    "is_enabled": True,
                    "display_order": float(session['id']) * 2.0 + 0.5,
                })
                room_id += 1
    
    # Add global rooms for all other events (2-6)
    event_configs = [
        (2, "Cloud Native Summit", "Cloud Native discussion"),
        (3, "AI/ML Workshop", "Machine Learning workshop discussion"), 
        (4, "Frontend Masters Conference", "Frontend development discussion"),
        (5, "DevOps & Security Summit", "DevOps and Security discussion"),
        (6, "Data & AI Conference", "Data Science and AI discussion")
    ]
    
    for event_id, event_name, description in event_configs:
        # General chat room for each event
        chat_rooms.extend([
            {
                "id": room_id,
                "event_id": event_id,
                "session_id": None,
                "name": "General Discussion",
                "description": description,
                "room_type": "GLOBAL",
                "is_enabled": True,
                "display_order": 1.0,
            },
            {
                "id": room_id + 1,
                "event_id": event_id,
                "session_id": None,
                "name": "Speakers Lounge",
                "description": f"Speaker coordination for {event_name}",
                "room_type": "GREEN_ROOM",
                "is_enabled": True,
                "display_order": 2.0,
            },
            {
                "id": room_id + 2,
                "event_id": event_id,
                "session_id": None,
                "name": "Admin Chat",
                "description": f"Event admins for {event_name}",
                "room_type": "ADMIN",
                "is_enabled": True,
                "display_order": 3.0,
            }
        ])
        room_id += 3
    
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
    """Generate diverse connections between users across all events"""
    connections = []
    connection_id = 1
    
    # Demo user connections (mix of accepted and pending)
    # Accepted connections
    accepted_connections = [
        (1, 2, "Hi Sarah! I'd love to connect and discuss distributed systems.", 1),
        (1, 3, "Great to meet another platform engineer! Let's connect.", 1),
        (1, 8, "Thanks for helping organize this amazing event!", 1),
        (15, 1, "Demo User, your platform work is inspiring! Would love to connect.", 1),
        (20, 1, "Hi! I'm interested in learning more about the Atria platform.", 1),
        (80, 1, "Loved your talk at Frontend Masters! Let's collaborate.", 4),
        (100, 1, "Your insights on AI are fascinating. Would love to discuss more!", 6),
    ]
    
    for requester, recipient, message, event_id in accepted_connections:
        connections.append({
            "id": connection_id,
            "requester_id": requester,
            "recipient_id": recipient,
            "status": "ACCEPTED",
            "icebreaker_message": message,
            "originating_event_id": event_id,
        })
        connection_id += 1
    
    # Pending connections (waiting for demo user response)
    pending_to_demo = [
        (25, 1, "Hi Demo User! Would love to discuss event management platforms.", 1),
        (30, 1, "Your keynote topic sounds fascinating! Can we connect?", 1),
        (35, 1, "I'm building a similar platform. Would appreciate your insights!", 1),
        (91, 1, "Great DevOps insights! Would love to connect.", 5),
        (105, 1, "Your AI conference talk was amazing! Let's connect.", 6),
    ]
    
    for requester, recipient, message, event_id in pending_to_demo:
        connections.append({
            "id": connection_id,
            "requester_id": requester,
            "recipient_id": recipient,
            "status": "PENDING",
            "icebreaker_message": message,
            "originating_event_id": event_id,
        })
        connection_id += 1
    
    # Pending connections from demo user
    pending_from_demo = [
        (1, 40, "Hi! Noticed you work in a similar space. Let's connect!", 1),
        (1, 45, "Would love to hear about your experience with microservices.", 1),
        (1, 110, "Your data engineering work sounds interesting!", 6),
    ]
    
    for requester, recipient, message, event_id in pending_from_demo:
        connections.append({
            "id": connection_id,
            "requester_id": requester,
            "recipient_id": recipient,
            "status": "PENDING",
            "icebreaker_message": message,
            "originating_event_id": event_id,
        })
        connection_id += 1
    
    # Generate more realistic connections across all users
    # Event 1 connections
    event1_connections = [
        (2, 3, "ACCEPTED", "Fellow speaker! Looking forward to your session.", 1),
        (2, 4, "ACCEPTED", "GitHub and Netflix collaboration! Let's connect.", 1),
        (5, 6, "ACCEPTED", "Great questions during the panel. Let's stay in touch!", 1),
        (10, 11, "PENDING", "Your ML work sounds interesting. Can we chat?", 1),
        (15, 20, "ACCEPTED", "Thanks for the great conversation at lunch!", 1),
        (25, 30, "PENDING", "Would love to connect and share cloud experiences.", 1),
        (35, 40, "ACCEPTED", "Great meeting you at the networking session!", 1),
        (45, 50, "PENDING", "Hi! I'm also interested in React performance.", 1),
        (3, 10, "REJECTED", "Thanks, but I'm keeping my network focused for now.", 1),
        (20, 25, "ACCEPTED", "Virtual networking for the win! Great to connect.", 1),
        (60, 65, "ACCEPTED", "Great discussion on microservices!", 1),
        (70, 75, "PENDING", "Would love to learn more about your work.", 1),
    ]
    
    # Event 2 connections (Cloud Native)
    event2_connections = [
        (26, 27, "ACCEPTED", "Fellow cloud architect! Let's share best practices.", 2),
        (28, 29, "ACCEPTED", "Kubernetes experts unite!", 2),
        (45, 46, "PENDING", "Your service mesh talk was enlightening.", 2),
        (50, 55, "ACCEPTED", "Great cloud migration insights!", 2),
    ]
    
    # Event 4 connections (Frontend Masters)
    event4_connections = [
        (80, 81, "ACCEPTED", "React developers unite! Great to meet you.", 4),
        (82, 83, "ACCEPTED", "TypeScript best practices discussion was great!", 4),
        (84, 85, "PENDING", "Would love to discuss component architectures.", 4),
        (86, 90, "ACCEPTED", "Your CSS-in-JS approach is interesting!", 4),
        (95, 100, "ACCEPTED", "Frontend performance optimization tips were helpful!", 4),
    ]
    
    # Event 5 connections (DevOps)
    event5_connections = [
        (91, 92, "ACCEPTED", "GitOps implementation strategies - let's chat!", 5),
        (93, 94, "ACCEPTED", "Security automation is the future!", 5),
        (95, 96, "PENDING", "Your CI/CD pipeline design is impressive.", 5),
        (97, 98, "ACCEPTED", "Infrastructure as Code best practices!", 5),
    ]
    
    # Event 6 connections (Data & AI)
    event6_connections = [
        (101, 102, "ACCEPTED", "ML pipelines at scale - great discussion!", 6),
        (103, 104, "ACCEPTED", "Data engineering challenges and solutions!", 6),
        (105, 110, "PENDING", "Your approach to feature engineering is novel.", 6),
        (115, 120, "ACCEPTED", "AI ethics discussion was thought-provoking!", 6),
        (125, 130, "ACCEPTED", "Deep learning applications in production!", 6),
    ]
    
    # Add all connections
    for connections_list in [event1_connections, event2_connections, event4_connections, 
                            event5_connections, event6_connections]:
        for requester, recipient, status, message, event_id in connections_list:
            connections.append({
                "id": connection_id,
                "requester_id": requester,
                "recipient_id": recipient,
                "status": status,
                "icebreaker_message": message,
                "originating_event_id": event_id,
            })
            connection_id += 1
    
    return connections


def generate_direct_message_threads() -> List[Dict[str, Any]]:
    """Generate DM threads between connected users across all events"""
    threads = []
    thread_id = 1
    
    # Threads for demo user's accepted connections
    demo_threads = [
        (1, 2), (1, 3), (1, 8), (1, 15), (1, 20), 
        (1, 80), (1, 100)  # New connections from other events
    ]
    
    for user1, user2 in demo_threads:
        threads.append({
            "id": thread_id,
            "user1_id": user1,
            "user2_id": user2,
            "is_encrypted": False
        })
        thread_id += 1
    
    # Other user threads across different events
    other_threads = [
        # Event 1 threads
        (2, 3), (2, 4), (5, 6), (15, 20), (35, 40),
        (60, 65), (20, 25),
        # Event 2 threads
        (26, 27), (28, 29), (50, 55),
        # Event 4 threads
        (80, 81), (82, 83), (86, 90), (95, 100),
        # Event 5 threads
        (91, 92), (93, 94), (97, 98),
        # Event 6 threads
        (101, 102), (103, 104), (115, 120), (125, 130),
        # Cross-event threads
        (45, 46), (95, 96)
    ]
    
    for user1, user2 in other_threads:
        threads.append({
            "id": thread_id,
            "user1_id": user1,
            "user2_id": user2,
            "is_encrypted": False
        })
        thread_id += 1
    
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
    """Generate event sponsors for all events"""
    sponsors = []
    sponsor_id = 1
    
    # Event 1 sponsors (Main conference - multiple tiers)
    event1_sponsors = [
        ("CloudTech Solutions", "Leading cloud infrastructure provider", "platinum", True),
        ("DevTools Pro", "Developer productivity tools", "gold", True),
        ("API Gateway Inc", "API management and security", "silver", False),
        ("DataStream Analytics", "Real-time data processing", "silver", False),
        ("SecureCode Systems", "Application security solutions", "gold", True),
    ]
    
    for name, description, tier, featured in event1_sponsors:
        sponsors.append({
            "id": sponsor_id,
            "event_id": 1,
            "name": name,
            "description": description,
            "website_url": f"https://{name.lower().replace(' ', '')}.example.com",
            "logo_url": f"https://via.placeholder.com/200x100/0066ff/ffffff?text={name.replace(' ', '+')}",
            "tier_id": tier,
            "display_order": sponsor_id,
            "is_active": True,
            "featured": featured,
            "social_links": {
                "twitter": f"https://twitter.com/{name.lower().replace(' ', '')}",
                "linkedin": f"https://linkedin.com/company/{name.lower().replace(' ', '')}"
            } if featured else {},
        })
        sponsor_id += 1
    
    # Event 2 sponsors (Cloud Native Summit)
    sponsors.append({
        "id": sponsor_id,
        "event_id": 2,
        "name": "Kubernetes Pro",
        "description": "Enterprise Kubernetes solutions",
        "website_url": "https://kubernetespro.example.com",
        "logo_url": "https://via.placeholder.com/200x100/00a86b/ffffff?text=K8s+Pro",
        "tier_id": None,
        "display_order": 1,
        "is_active": True,
        "featured": True,
        "social_links": {"twitter": "https://twitter.com/k8spro"},
    })
    sponsor_id += 1
    
    # Event 4 sponsors (Frontend Masters)
    frontend_sponsors = [
        ("React Framework Co", "Next-gen React tooling", True),
        ("TypeScript Tools", "TypeScript development solutions", True),
        ("CSS Masters", "Advanced styling solutions", False),
    ]
    
    for name, description, featured in frontend_sponsors:
        sponsors.append({
            "id": sponsor_id,
            "event_id": 4,
            "name": name,
            "description": description,
            "website_url": f"https://{name.lower().replace(' ', '')}.example.com",
            "logo_url": f"https://via.placeholder.com/200x100/ff6b6b/ffffff?text={name.replace(' ', '+')}",
            "tier_id": None,
            "display_order": sponsor_id - 6,
            "is_active": True,
            "featured": featured,
            "social_links": {"twitter": f"https://twitter.com/{name.lower().replace(' ', '')}"} if featured else {},
        })
        sponsor_id += 1
    
    # Event 5 sponsors (DevOps Summit)
    sponsors.append({
        "id": sponsor_id,
        "event_id": 5,
        "name": "CI/CD Pipeline Pro",
        "description": "Continuous integration and deployment",
        "website_url": "https://cicdpro.example.com",
        "logo_url": "https://via.placeholder.com/200x100/4a90e2/ffffff?text=CI+CD",
        "tier_id": None,
        "display_order": 1,
        "is_active": True,
        "featured": True,
        "social_links": {"linkedin": "https://linkedin.com/company/cicdpro"},
    })
    sponsor_id += 1
    
    # Event 6 sponsors (Data & AI Conference)
    ai_sponsors = [
        ("ML Platform Inc", "Machine learning infrastructure", True),
        ("DataLake Solutions", "Big data storage and processing", True),
    ]
    
    for name, description, featured in ai_sponsors:
        sponsors.append({
            "id": sponsor_id,
            "event_id": 6,
            "name": name,
            "description": description,
            "website_url": f"https://{name.lower().replace(' ', '')}.example.com",
            "logo_url": f"https://via.placeholder.com/200x100/9b59b6/ffffff?text={name.replace(' ', '+')}",
            "tier_id": None,
            "display_order": sponsor_id - 10,
            "is_active": True,
            "featured": featured,
            "social_links": {"twitter": f"https://twitter.com/{name.lower().replace(' ', '')}"} if featured else {},
        })
        sponsor_id += 1
    
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
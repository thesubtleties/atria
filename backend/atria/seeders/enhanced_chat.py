# Enhanced chat message generation with realistic conversations
import random
from typing import List, Dict, Any

def generate_enhanced_chat_messages() -> List[Dict[str, Any]]:
    """Generate 200+ messages in popular chat rooms for realistic feel with 150+ users"""
    messages = []
    message_id = 1
    
    # Room 1 - General Chat (Event 1) - Very active with 150+ messages
    # Using expanded user base (user IDs 1-151) and realistic timestamps
    general_chat_messages = [
        # Early Morning - September 15, 2025 (Day 1)
        (16, "Good morning everyone! Excited for day 1 of Atria TechConf! 🎉"),
        (23, "Can't wait for the opening keynote at 9 AM!"),
        (87, "Flying in from Berlin, just landed! Coffee recommendations?"),
        (142, "Welcome! There's a great cafe across from the convention center"),
        (35, "Anyone know if the conference coffee is any good this year?"),
        (42, "Coffee station is already open near the main entrance - much better than last year!"),
        (35, "Thanks! Heading there now"),
        (91, "The venue setup looks incredible this year!"),
        (128, "So much bigger than 2024! Love the new layout"),
        (18, "Registration was so smooth, props to the organizers"),
        (103, "First time at Atria conf, any veteran tips?"),
        (16, "@User103 Don't miss the networking sessions, and grab lunch early!"),
        (145, "WiFi password anyone? The QR codes aren't working for me"),
        (42, "ATRIATECH2025 - all caps, no spaces"),
        (145, "Perfect, thanks!"),
        (67, "Which tracks are you all planning? So many good options"),
        (84, "Microservices track for me, then the AI panel"),
        (119, "Kubernetes workshop is a must-attend!"),
        (133, "Same! Heard Marcus Rodriguez is incredible"),
        (27, "The full stack of sessions today looks amazing"),
        
        # Mid-morning buzz
        (1, "Welcome everyone! I'm one of the organizers. Feel free to ask any questions!"),
        (58, "Where's the best place to sit for the keynote?"),
        (1, "Middle section has the best view of both screens"),
        (63, "Are the sessions being recorded?"),
        (1, "Yes! All sessions will be available to attendees post-conference"),
        (71, "That's awesome, thanks!"),
        (24, "Anyone else having trouble with the event app?"),
        (36, "Try logging out and back in, worked for me"),
        (24, "That worked, thanks!"),
        
        # Keynote reactions
        (17, "Keynote starting in 5 minutes!"),
        (29, "Already in my seat, so hyped!"),
        (41, "The opening video is incredible!"),
        (53, "This keynote is mind-blowing 🤯"),
        (65, "The AI demo is insane!"),
        (20, "Did anyone catch that GitHub repo they mentioned?"),
        (31, "github.com/atria/future-stack"),
        (20, "Perfect, thanks!"),
        (44, "Best keynote I've seen in years"),
        (56, "The quantum computing part was fascinating"),
        (68, "I need to rewatch this later, so much to absorb"),
        
        # Post-keynote discussions
        (22, "What sessions is everyone heading to next?"),
        (34, "Microservices track for me"),
        (46, "GraphQL vs REST comparison sounds interesting"),
        (59, "Kubernetes workshop is filling up fast!"),
        (70, "Already in line for the workshop"),
        (25, "How long is the lunch break?"),
        (1, "90 minutes, from 12:00 to 13:30"),
        (37, "Any vegetarian options for lunch?"),
        (1, "Yes! Full vegetarian station near the west entrance"),
        (37, "Excellent, thank you!"),
        
        # Afternoon discussions
        (28, "The microservices talk was exactly what I needed"),
        (40, "Kubernetes workshop is hands-on heaven!"),
        (51, "Anyone at the GraphQL talk? How is it?"),
        (64, "Really good! Lots of practical examples"),
        (21, "Panel discussion starting soon in main hall"),
        (32, "AI panel has an amazing lineup"),
        (43, "Getting in line now"),
        (54, "Standing room only for the AI panel!"),
        (66, "They're streaming it in overflow room B"),
        (38, "The panelists' insights on MLOps are gold"),
        (49, "Someone please share notes from the panel later!"),
        (60, "I'm taking detailed notes, will share"),
        (49, "You're the best!"),
        
        # Late afternoon
        (26, "Last session of the day coming up"),
        (39, "WebAssembly talk or Redis patterns?"),
        (50, "WASM talk is supposed to be amazing"),
        (61, "Redis talk has great reviews from other conferences"),
        (72, "Why not split up and share notes later?"),
        (39, "Great idea!"),
        
        # Evening networking
        (30, "Welcome reception starting at 5!"),
        (41, "Free drinks and food?"),
        (1, "Yes! Full bar and appetizers"),
        (53, "See everyone there!"),
        (65, "Great first day everyone!"),
        (18, "Learned so much already"),
        (47, "Tomorrow's lineup looks even better"),
        (55, "Don't forget to charge your devices tonight"),
        (67, "Good reminder!"),
        (73, "What time do doors open tomorrow?"),
        (1, "Doors open at 8:30 AM"),
        (73, "Perfect, thanks!"),
        
        # Day 2 Morning - September 16, 2025 - Add 80+ more messages with more users
        (89, "Good morning day 2! Who's pumped for the deep dive sessions?"),
        (106, "Already on my third espresso and ready to roll!"),
        (31, "Emily's security keynote should be game-changing"),
        (127, "Then straight to the React Server Components talk"),
        (54, "RSC is the future, can't wait to see the Netflix implementation"),
        (66, "Their scale stories are always mind-blowing"),
        (92, "Anyone tried the breakfast spread today?"),
        (23, "Yes! The Belgian waffles are incredible"),
        (149, "And they have oat milk for the coffee now!"),
        (35, "Conference catering has seriously leveled up"),
        (113, "Remember the sad sandwich days of 2023?"),
        (47, "Those were truly dark times 😂"),
        (134, "Security keynote starting in 15 minutes!"),
        (59, "Getting seats now, don't want to miss this one"),
        (81, "AI security is such a hot topic right now"),
        (98, "The sponsor expo is amazing this year"),
        (68, "Got some incredible swag from the Postgres booth"),
        (21, "The GitHub booth has limited edition Octocat pins!"),
        (125, "And React has some sweet new hoodies"),
        (33, "My backpack is getting heavy with all this swag"),
        (148, "Good problems to have! 😄"),
        (45, "Love how the community comes together at these events"),
        
        # Day 2 Sessions - More diverse user participation
        (34, "Marcus's RSC talk completely changed how I think about React"),
        (96, "The performance metrics he showed were insane - 60% faster TTI"),
        (46, "But that mental model shift from client-side rendering is tough"),
        (117, "Worth every minute of learning curve for the UX wins"),
        (58, "The Go vs Rust panel got spicy! 🌶️"),
        (139, "Both languages have such passionate communities"),
        (70, "Honestly, choose the right tool for the job"),
        (24, "Rust for performance-critical systems, Go for rapid development"),
        (101, "Why not polyglot? Use whatever solves the problem best"),
        (36, "The GitOps workshop is pure hands-on gold"),
        (122, "ArgoCD just clicked for me after that demo"),
        (48, "The declarative approach finally makes sense"),
        (85, "Our deployment pipeline is about to get so much cleaner"),
        (60, "GitOps + Kubernetes = DevOps nirvana"),
        
        # Lunch discussions - Day 2 networking
        (26, "Those lightning talks during lunch were absolutely brilliant"),
        (111, "5-minute format keeps everyone engaged and sharp"),
        (38, "Honestly got more actionable insights than some keynotes"),
        (130, "We should pitch this format to other conferences"),
        (50, "Multi-cloud panel is starting - this should be interesting"),
        (88, "Vendor lock-in is the elephant in the room for most companies"),
        (62, "AWS vs Azure vs GCP - may the best cloud win! 🥊"),
        (104, "Plot twist: hybrid and multi-cloud is the real answer"),
        (27, "Serverless session is completely packed!"),
        (143, "They opened overflow room C for streaming"),
        (39, "Cold start latency discussion was eye-opening"),
        (75, "Edge computing is going to change everything"),
        (116, "Especially for real-time applications like gaming and IoT"),
        
        # Afternoon sessions - Peak engagement
        (29, "Real-time data pipeline workshop is intense"),
        (41, "Kafka + Flink is powerful"),
        (53, "But complex to operate"),
        (65, "Vector databases talk blew my mind"),
        (71, "AI is changing everything"),
        (30, "Zero trust architecture session was eye-opening"),
        (42, "Security can't be an afterthought"),
        (54, "Implementing this Monday!"),
        (66, "Supply chain security is scary"),
        (74, "So many vulnerabilities"),
        (31, "Pen testing automation saves so much time"),
        (43, "CI/CD integration is key"),
        
        # Day 3 anticipation
        # Day 3 anticipation - September 17, 2025
        (55, "Can't believe tomorrow is already the finale!"),
        (129, "The quantum computing session is going to blow minds"),
        (67, "And the WebXR demos look incredible"),
        (141, "AR/VR in the browser is finally getting real"),
        (75, "Blockchain workshop should be practical this year"),
        (93, "Less hype, more real-world implementation"),
        (32, "The closing keynote lineup is absolutely stacked"),
        (110, "Awards ceremony always gives me chills"),
        (44, "This has been the best Atria conference yet"),
        (135, "The quality of content this year is unmatched"),
        (56, "Agreed! Every session has been practical and actionable"),
        (82, "The networking opportunities have been incredible"),
        (68, "Made connections that will last years"),
        (147, "Already planning collaborations with people I've met"),
        (19, "The community aspect is what makes this conference special"),
        (99, "Speaking of community, drinks after tomorrow's closing?"),
        (33, "Absolutely! Let's celebrate properly"),
        (124, "I know a great spot near the venue"),
        (45, "Count me in! Been looking forward to it"),
        (86, "This conference has literally changed my perspective on tech"),
        (57, "Same here - going back to work with so many new ideas"),
        (112, "My team is going to think I joined a cult 😂"),
        (69, "The good kind of cult - the learning and growing kind!"),
        (137, "Early bird tickets for next year better be announced soon"),
        (1, "Stay tuned... big announcements coming! 😉"),
        (34, "The suspense is killing us!"),
        (108, "This community truly is something special"),
        (46, "See everyone bright and early for the grand finale!"),
        (131, "Last day - let's make every minute count"),
        
        # Additional diverse voices from the expanded user base
        (78, "Data pipeline workshop yesterday changed my entire approach"),
        (95, "Kafka + Flink combo is powerful but complex - worth the learning curve"),
        (114, "Vector databases talk was perfectly timed for our AI project"),
        (146, "Zero trust security is no longer optional in 2025"),
        (72, "Supply chain security discussion was genuinely scary but necessary"),
        (105, "Penetration testing automation will save our team weeks of work"),
        (123, "The ML model monitoring insights were gold"),
        (90, "Edge computing demos made the future feel tangible"),
        (107, "Quantum algorithms for developers was surprisingly accessible"),
        (140, "IoT architecture patterns session filled a major knowledge gap"),
        (77, "The ethics in AI panel was thought-provoking"),
        (100, "Open source sustainability is such an important topic"),
        (121, "Building inclusive tech teams should be required viewing"),
        (136, "Career growth workshop gave me concrete next steps"),
        (74, "This conference consistently delivers on its promise"),
        (94, "Three days of pure learning and connection"),
        (115, "Already looking forward to implementing everything I've learned"),
        (144, "The real work starts Monday - but I'm ready! 💪"),
        (73, "Thank you to all the speakers, organizers, and fellow attendees"),
        (97, "This community makes the tech world a better place"),
        (118, "Until next year, Atria family! 🚀"),
        (150, "Can't wait to see what everyone builds with these new insights!"),
        (80, "The innovation happening here will shape the industry"),
        (102, "Proud to be part of this incredible tech community"),
        (126, "See you all tomorrow for the grand finale! 🎉"),
    ]
    
    for user_id, content in general_chat_messages:
        messages.append({
            "id": message_id,
            "room_id": 1,  # General Chat
            "user_id": user_id,
            "content": content,
        })
        message_id += 1
    
    # Room 2 - Green Room (Speakers) - Moderate activity (30+ messages)
    green_room_messages = [
        (1, "Welcome speakers! This is your private space to connect"),
        (2, "Thanks for having us! Looking forward to presenting"),
        (3, "Anyone else nervous about their talk?"),
        (4, "Always get butterflies, even after 50+ talks"),
        (5, "That's actually reassuring to hear"),
        (6, "Pro tip: Power poses before going on stage really help"),
        (7, "I do breathing exercises"),
        (10, "My slides are still not perfect 😅"),
        (11, "Perfectionism is the enemy of done!"),
        (12, "True! They're good enough"),
        (2, "Anyone want to practice together?"),
        (3, "I'm in! Meet in speaker prep room?"),
        (2, "See you in 10"),
        (13, "How's the AV setup this year?"),
        (1, "All updated! HDMI and USB-C available, wireless presenting too"),
        (14, "Fantastic! Wireless is a game changer"),
        (4, "Clicker batteries died last year mid-talk 😂"),
        (5, "Nightmare fuel!"),
        (6, "Always bring backup batteries"),
        (7, "And backup slides on USB"),
        (10, "And backup laptop..."),
        (11, "At this rate, bring a backup speaker too!"),
        (12, "😂😂😂"),
        (2, "Good luck everyone with your sessions today!"),
        (3, "Break a leg!"),
        (4, "You're all going to be amazing"),
        (1, "Proud of our speaker lineup this year"),
        (13, "Best conference speaker experience I've had"),
        (14, "The green room snacks are elite"),
        (5, "That coffee machine is saving my life"),
        (6, "Same! On my third cup"),
    ]
    
    for user_id, content in green_room_messages:
        messages.append({
            "id": message_id,
            "room_id": 2,  # Green Room
            "user_id": user_id,
            "content": content,
        })
        message_id += 1
    
    # Add messages for new events with expanded user base
    # Event 4 - Frontend Masters Conference (December 2025)
    frontend_messages = [
        (89, "Welcome to Frontend Masters! Excited to dive deep into modern frontend"),
        (134, "The React Server Components workshop is going to be incredible"),
        (76, "CSS Grid techniques session can't come soon enough"),
        (118, "Web performance in 2025 - finally addressing the elephant in the room"),
        (102, "Framework wars panel should be entertaining 😄"),
        (147, "TypeScript patterns workshop is exactly what our team needs"),
        (91, "Micro-frontends architecture - been waiting for this topic"),
        (125, "WebAssembly for frontend devs is the future"),
    ]
    
    # Event 4 General Chat - room ID 170 (calculated exactly)
    for user_id, content in frontend_messages:
        messages.append({
            "id": message_id,
            "room_id": 170,  # Event 4 General Chat
            "user_id": user_id,
            "content": content,
        })
        message_id += 1
    
    # Event 5 - DevOps & Security Summit (January 2026)
    devops_messages = [
        (95, "Platform engineering is definitely the evolution beyond traditional DevOps"),
        (142, "GitOps with ArgoCD workshop - this is what we've been waiting for"),
        (83, "Infrastructure as Code with Terraform never gets old"),
        (129, "OpenTelemetry observability is becoming the standard"),
        (107, "Container security can't be an afterthought anymore"),
        (151, "Zero trust in 2026 - about time this became mainstream"),
        (88, "Kubernetes security hardening is critical knowledge"),
        (116, "Supply chain security keeps me up at night"),
    ]
    
    for user_id, content in devops_messages:
        messages.append({
            "id": message_id,
            "room_id": 173,  # Event 5 General Chat
            "user_id": user_id,
            "content": content,
        })
        message_id += 1
    
    # Event 6 - Data & AI Conference (February 2026)
    data_ai_messages = [
        (104, "The future of data infrastructure is here and it's beautiful"),
        (138, "Real-time pipelines with Kafka - still the gold standard"),
        (79, "Data mesh architecture is finally making sense to me"),
        (120, "Vector databases for AI - this is where the magic happens"),
        (96, "Data privacy and ethics panel should be mandatory viewing"),
        (143, "AI in production lessons are exactly what we need"),
        (81, "LLM fine-tuning workshop - practical AI implementation"),
        (113, "MLOps best practices will transform our workflow"),
        (149, "AI model monitoring - detecting drift before it's too late"),
        (87, "Ethical AI development isn't optional anymore"),
    ]
    
    for user_id, content in data_ai_messages:
        messages.append({
            "id": message_id,
            "room_id": 176,  # Event 6 General Chat
            "user_id": user_id,
            "content": content,
        })
        message_id += 1
    
    # Room 3 - Admin Room (Organizers) - Moderate activity (25+ messages)
    admin_messages = [
        (1, "Team, everything ready for opening?"),
        (8, "Registration desk is set up and staffed"),
        (15, "AV check complete for main hall"),
        (22, "Catering confirmed and arriving at 7:30"),
        (1, "Excellent! Let's make this amazing"),
        (8, "Slight backup at registration"),
        (15, "Sending two more volunteers"),
        (8, "That helped, queue moving now"),
        (22, "Coffee stations need refill already!"),
        (1, "The coffee addiction is real 😄"),
        (15, "Keynote speaker has arrived"),
        (1, "Perfect! Please escort to green room"),
        (8, "Workshop room C projector issues"),
        (15, "IT on the way"),
        (15, "Fixed! Loose cable"),
        (22, "Lunch setup starting at 11:30"),
        (1, "Remember all-hands at 6 PM today"),
        (8, "WiFi holding up well, 450 concurrent users"),
        (15, "Stream quality looks good"),
        (22, "Had a medical incident, handled well"),
        (1, "Great job on quick response"),
        (8, "Attendee feedback is overwhelmingly positive!"),
        (15, "Social media is buzzing about the keynote"),
        (22, "Tomorrow's schedule confirmed with all speakers"),
        (1, "Team, you're all doing amazing work!"),
    ]
    
    for user_id, content in admin_messages:
        messages.append({
            "id": message_id,
            "room_id": 3,  # Admin Room
            "user_id": user_id,
            "content": content,
        })
        message_id += 1
    
    # Session-specific public rooms with varied activity
    # Room IDs: 4=Session1 Chat, 6=Session2 Chat, 8=Session3 Chat, 10=Session5 Chat
    session_rooms = [
        (8, [  # Session 3 Chat (Kubernetes Workshop)
            (3, "Instructor here! Setting up now"),
            (33, "So excited for this workshop!"),
            (48, "Is this beginner friendly?"),
            (3, "Absolutely! We'll start with basics"),
            (70, "Should we have kubectl installed?"),
            (3, "We'll use a cloud environment, no local setup needed"),
            (59, "Perfect!"),
            (4, "I'll be assisting today"),
            (33, "This hands-on approach is perfect"),
            (48, "Deployments are making sense now!"),
            (70, "The examples are so practical"),
            (3, "Feel free to ask questions anytime!"),
        ]),
        (4, [  # Session 1 Chat (Opening Keynote)
            (16, "Can't wait for this to start!"),
            (28, "Demo User's talks are always inspiring"),
            (40, "The topic sounds fascinating"),
            (52, "Already taking notes"),
            (64, "This is going to be epic!"),
        ]),
        (10, [  # Session 5 Chat (AI Panel)
            (12, "Panel starting in 10 minutes"),
            (5, "Looking forward to the MLOps discussion"),
            (6, "Hope they cover deployment challenges"),
            (7, "And scaling issues"),
            (10, "Monitoring ML models in prod is my pain point"),
            (11, "Same here!"),
            (38, "This panel is fire! 🔥"),
            (49, "Best insights on model drift I've heard"),
            (60, "The production tips are gold"),
        ]),
    ]
    
    for room_id, room_messages in session_rooms:
        for user_id, content in room_messages:
            messages.append({
                "id": message_id,
                "room_id": room_id,
                "user_id": user_id,
                "content": content,
            })
            message_id += 1
    
    # Event 2 chat rooms (moderate activity)
    event2_messages = [
        (12, [  # Room 12 is General Discussion for Event 2
            (25, "Welcome to Cloud Native Summit!"),
            (26, "Great to be here"),
            (27, "Looking forward to the service mesh workshop"),
            (28, "Container security panel should be interesting"),
            (29, "Anyone tried Istio in production?"),
            (45, "Yes, bit of a learning curve but worth it"),
            (46, "KEDA talk later looks promising"),
            (47, "Autoscaling is always a hot topic"),
        ]),
    ]
    
    for room_id, room_messages in event2_messages:
        for user_id, content in room_messages:
            messages.append({
                "id": message_id,
                "room_id": room_id,
                "user_id": user_id,
                "content": content,
            })
            message_id += 1
    
    # Event 3 (small workshop) - minimal messages
    # Use room 14 which is Workshop Chat for Event 2 (we can repurpose for Event 3 messages)
    messages.extend([
        {
            "id": message_id,
            "room_id": 14,  # Workshop Chat
            "user_id": 30,
            "content": "Welcome to the ML workshop!",
        },
        {
            "id": message_id + 1,
            "room_id": 14,
            "user_id": 31,
            "content": "We'll start with environment setup",
        },
        {
            "id": message_id + 2,
            "room_id": 14,
            "user_id": 32,
            "content": "Ready to learn!",
        },
    ])
    
    return messages
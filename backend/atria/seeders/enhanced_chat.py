# Enhanced chat message generation with realistic conversations
import random
from typing import List, Dict, Any

def generate_enhanced_chat_messages() -> List[Dict[str, Any]]:
    """Generate 50+ messages in popular chat rooms for realistic feel"""
    messages = []
    message_id = 1
    
    # Room 1 - General Chat (Event 1) - Very active with 75+ messages
    general_chat_messages = [
        # Morning messages
        (16, "Good morning everyone! Excited for day 1! 🎉"),
        (23, "Can't wait for the opening keynote!"),
        (35, "Anyone know if coffee is available yet?"),
        (42, "Coffee station is open near the main entrance!"),
        (35, "Thanks! Heading there now"),
        (18, "The venue is amazing! So much bigger than last year"),
        (45, "First time at this conference, any tips?"),
        (16, "@User45 Don't miss the networking sessions, great for connections!"),
        (52, "WiFi password anyone?"),
        (42, "ATRIA2025 - all caps"),
        (52, "Thanks!"),
        (19, "Which track are you all planning to attend?"),
        (27, "I'm going for the microservices talk"),
        (33, "Kubernetes workshop for me!"),
        (48, "Same here, K8s workshop looks great"),
        
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
        
        # Day 2 Morning - Add 50+ more messages for pagination testing
        (19, "Good morning day 2! Who's ready?"),
        (31, "Already caffeinated and excited!"),
        (42, "The security keynote this morning should be interesting"),
        (54, "I'm heading to the React performance talk after"),
        (66, "Same! Netflix's scale insights will be valuable"),
        (23, "Anyone tried the breakfast yet?"),
        (35, "Yes! Great selection today"),
        (47, "The pastries are amazing"),
        (59, "Conference food has really improved"),
        (20, "True! Remember when it was just bagels?"),
        (32, "Those were dark times 😂"),
        (44, "Security keynote starting soon!"),
        (56, "Already heading to the main hall"),
        (68, "Save me a seat!"),
        (21, "The sponsor booths have great swag today"),
        (33, "Got some nice t-shirts!"),
        (45, "The GitHub booth has stickers"),
        (57, "Love conference stickers"),
        (69, "My laptop is running out of space for them"),
        (22, "First world problems!"),
        
        # Day 2 Sessions
        (34, "React Server Components talk was mind-blowing"),
        (46, "The performance gains are incredible"),
        (58, "But the mental model shift is real"),
        (70, "Worth it for the UX improvements"),
        (24, "Go vs Rust debate was heated!"),
        (36, "Both have their place IMO"),
        (48, "Rust for systems, Go for services"),
        (60, "Why not both? 🤷"),
        (25, "GitOps workshop is hands-on gold"),
        (37, "ArgoCD is a game changer"),
        (49, "Finally understanding the workflow"),
        (61, "This will save us so much time"),
        
        # Lunch discussions
        (26, "Lightning talks during lunch were brilliant"),
        (38, "5 minute talks are perfect format"),
        (50, "Got more value than some hour-long sessions"),
        (62, "Should do this every day"),
        (27, "Multi-cloud panel starting"),
        (39, "Vendor lock-in discussion should be spicy"),
        (51, "AWS vs Azure vs GCP - fight!"),
        (63, "Plot twist: they all have trade-offs"),
        (28, "Serverless talk is packed!"),
        (40, "Standing room only"),
        (52, "The cold start problem discussion was great"),
        (64, "Edge computing is the future"),
        
        # Afternoon buzz
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
        (55, "Can't believe it's the last day tomorrow"),
        (67, "Quantum computing session will be interesting"),
        (75, "Blockchain workshop too"),
        (32, "AR/VR with WebXR sounds fun"),
        (44, "The closing keynote speaker is amazing"),
        (56, "Awards ceremony should be good"),
        (68, "Best conference in years"),
        (19, "Agreed! So much practical knowledge"),
        (33, "The networking alone was worth it"),
        (45, "Made so many connections"),
        (57, "Already planning for next year"),
        (69, "Early bird tickets?"),
        (1, "We'll announce soon! 😉"),
        (34, "Can't wait!"),
        (46, "This community is the best"),
        (58, "See everyone tomorrow for the finale!"),
        (70, "Last day, let's make it count!"),
        (21, "Meeting up for drinks after?"),
        (35, "Absolutely!"),
        (47, "Count me in"),
        (59, "Let's celebrate a great conference"),
        (22, "Perfect way to end it"),
        (36, "What a journey this has been"),
        (48, "Learned more in 3 days than 3 months"),
        (60, "Implementation ideas overflowing"),
        (23, "My notebook is completely full"),
        (37, "Thank goodness for session recordings"),
        (49, "Going to rewatch so many"),
        (61, "The workshops especially"),
        (24, "Team is going to love these insights"),
        (38, "Monday standup will be interesting"),
        (50, "So many things to try"),
        (62, "Prioritization will be key"),
        (25, "Start small, iterate fast"),
        (39, "Best advice from the conference"),
        (51, "Ship it!"),
        (63, "But test first 😄"),
        (26, "Anyone doing the certification exam?"),
        (40, "Thinking about it"),
        (52, "The cloud native cert looks valuable"),
        (64, "Study group?"),
        (27, "I'm in!"),
        (41, "Me too"),
        (53, "Let's ace it together"),
        (65, "Community learning is the best"),
        (28, "This chat has been so helpful"),
        (42, "Better than Slack!"),
        (54, "Real-time conference chat is brilliant"),
        (66, "Should be standard at every event"),
        (1, "Thanks everyone! You make it special"),
        (29, "Thank YOU for organizing!"),
        (43, "Incredible event"),
        (55, "See you all tomorrow!"),
        (67, "Bright and early"),
        (74, "Worth every minute"),
        (75, "💯"),
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
# Long DM conversation for pagination testing
from typing import List, Dict, Any

def generate_long_dm_conversations() -> List[Dict[str, Any]]:
    """Generate 50+ message DM conversation for pagination testing"""
    messages = []
    message_id = 1
    
    # Thread 1: Demo User <-> Sarah Chen - LONG technical discussion (60+ messages)
    thread1_messages = [
        (1, 2, "Hi Sarah! Thanks for accepting my connection request."),
        (2, 1, "Happy to connect! Your work on the Atria platform looks impressive."),
        (1, 2, "Thank you! I saw you're speaking about distributed systems. What will you cover?"),
        (2, 1, "I'll be discussing patterns we use at Netflix for handling millions of concurrent users."),
        (1, 2, "That sounds fascinating! How do you handle data consistency?"),
        (2, 1, "Great question! We use eventual consistency with conflict resolution strategies."),
        (1, 2, "Do you use CRDTs at all?"),
        (2, 1, "Yes! For certain use cases like watch lists and user preferences."),
        (1, 2, "That's clever. How about for real-time features?"),
        (2, 1, "WebSockets with fallback to SSE, plus Redis for pub/sub."),
        (1, 2, "We're using a similar approach for Atria's chat features."),
        (2, 1, "Nice! How are you handling message ordering?"),
        (1, 2, "Timestamp-based with vector clocks for conflict resolution."),
        (2, 1, "Smart. Have you had issues with clock drift?"),
        (1, 2, "Some. We implemented NTP sync checks on the backend."),
        (2, 1, "That's a good approach. What about message delivery guarantees?"),
        (1, 2, "At-least-once delivery with idempotency keys."),
        (2, 1, "Classic pattern. How's your database architecture?"),
        (1, 2, "PostgreSQL primary with read replicas, Redis for caching."),
        (2, 1, "Solid choice. Any sharding?"),
        (1, 2, "Not yet, but we're designing for it. Considering Vitess."),
        (2, 1, "Vitess is great. We use custom sharding at Netflix."),
        (1, 2, "How do you handle cross-shard queries?"),
        (2, 1, "Scatter-gather with async aggregation. It's complex but works."),
        (1, 2, "I can imagine. What about your microservices communication?"),
        (2, 1, "gRPC for internal, REST for external APIs."),
        (1, 2, "Same here! Do you use service mesh?"),
        (2, 1, "Yes, custom solution similar to Istio but optimized for our scale."),
        (1, 2, "Interesting. How do you handle service discovery?"),
        (2, 1, "Custom registry with health checking and load balancing."),
        (1, 2, "We're using Consul. Working well so far."),
        (2, 1, "Consul is solid. How about your deployment pipeline?"),
        (1, 2, "GitOps with ArgoCD, rolling deployments with canary releases."),
        (2, 1, "Nice! We do blue-green with automated rollback triggers."),
        (1, 2, "What metrics trigger rollbacks?"),
        (2, 1, "Error rates, latency P99, and business metrics like play starts."),
        (1, 2, "Business metrics in deployment decisions - that's smart."),
        (2, 1, "Critical at our scale. One bad deploy can cost millions."),
        (1, 2, "I believe it. How do you test at that scale?"),
        (2, 1, "Chaos engineering, load testing with production traffic replay."),
        (1, 2, "Traffic replay is interesting. How do you handle PII?"),
        (2, 1, "Automated scrubbing and tokenization before replay."),
        (1, 2, "Makes sense. What about your monitoring stack?"),
        (2, 1, "Custom metrics pipeline, but moving towards OpenTelemetry."),
        (1, 2, "We're all-in on OpenTelemetry. Great decision."),
        (2, 1, "How's the performance overhead?"),
        (1, 2, "Minimal with sampling. About 1-2% CPU increase."),
        (2, 1, "That's acceptable. What sampling rate?"),
        (1, 2, "0.1% for normal traffic, 100% for errors."),
        (2, 1, "Good strategy. How about your frontend architecture?"),
        (1, 2, "React with Redux, moving to RTK Query for data fetching."),
        (2, 1, "RTK Query is fantastic. Big improvement over plain Redux."),
        (1, 2, "Agreed! The caching is so much better."),
        (2, 1, "Have you looked at React Server Components?"),
        (1, 2, "Experimenting with them. The DX is interesting."),
        (2, 1, "We're going all-in. Initial results are promising."),
        (1, 2, "What kind of performance improvements are you seeing?"),
        (2, 1, "30-40% reduction in client bundle size, better INP scores."),
        (1, 2, "Impressive! Any downsides?"),
        (2, 1, "Complexity increase, harder mental model for developers."),
        (1, 2, "That's our concern too. How's the migration going?"),
        (2, 1, "Gradual. Route by route. Can't do big bang at our scale."),
        (1, 2, "Smart approach. Speaking of scale, how many engineers?"),
        (2, 1, "About 2000 in product engineering."),
        (1, 2, "Wow! How do you coordinate at that scale?"),
        (2, 1, "Strong platform teams, good tooling, clear interfaces."),
        (1, 2, "Platform teams are crucial. We're building ours now."),
        (2, 1, "Start with developer experience. It pays dividends."),
        (1, 2, "Any specific tools you'd recommend?"),
        (2, 1, "Backstage for developer portal, great for documentation."),
        (1, 2, "We're looking at Backstage! How's your experience?"),
        (2, 1, "Positive overall. Some customization needed but worth it."),
        (1, 2, "This conversation has been incredibly valuable. Thanks for sharing your expertise!"),
        (2, 1, "Anytime! This is why I love the tech community - knowledge sharing is what drives us forward."),
        (1, 2, "Absolutely. Looking forward to your keynote tomorrow!"),
        (2, 1, "Thanks! I'm excited to share what we've learned. See you bright and early!"),
        (1, 2, "Wouldn't miss it! Break a leg out there."),
        (2, 1, "Appreciate it! Talk soon."),
        
        # Post-keynote follow-up - September 2025
        (1, 2, "Sarah, your keynote was absolutely phenomenal! The distributed systems patterns you shared were game-changing."),
        (2, 1, "Thank you so much! The audience engagement was incredible. Loved the questions afterward."),
        (1, 2, "The part about handling 100M+ concurrent connections was mind-blowing. How long did it take to implement?"),
        (2, 1, "About 18 months with a team of 12 engineers. Lots of iterations and learning from failures."),
        (1, 2, "The resilience patterns you described - are those documented anywhere?"),
        (2, 1, "We're working on open-sourcing some of our tooling. I'll keep you posted!"),
        (1, 2, "That would be amazing! The community would benefit tremendously."),
        (2, 1, "That's the goal. Netflix believes in giving back to the ecosystem that helped us grow."),
        (1, 2, "It shows. Thanks for leading by example in our industry."),
        (2, 1, "We're all in this together! How did the rest of the conference go for you?"),
        (1, 2, "Incredible! The React workshop was packed, and the AI panel generated so much discussion."),
        (2, 1, "I caught part of the AI panel - the ethical considerations discussion was particularly important."),
        (1, 2, "Yes! It's refreshing to see these conversations happening at the platform level."),
        (2, 1, "As the tech gets more powerful, our responsibility grows. I'm glad events like yours facilitate these discussions."),
        (1, 2, "That's exactly what we hoped to achieve. Thank you for being such an integral part of it."),
        (2, 1, "Honor to be involved. Same time next year?"),
        (1, 2, "You'll be the first person I reach out to! 😊"),
        (2, 1, "Looking forward to it! Until then, keep building amazing things."),
        (1, 2, "You too! Thanks for everything, Sarah."),
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
    
    # Thread 2: Demo User <-> Marcus Rodriguez - Workshop coordination conversation
    # August-September 2025
    thread2_messages = [
        (3, 1, "Thanks for connecting! Super excited about the React performance workshop at Atria TechConf."),
        (1, 3, "Marcus! So glad you could join us. Your workshop is already one of the most anticipated sessions."),
        (3, 1, "That's amazing to hear! I've prepared some really intensive hands-on exercises with real performance problems to solve."),
        (1, 3, "Perfect! What should attendees bring? Any specific setup requirements?"),
        (3, 1, "Just a laptop with Node 18+ and VS Code. I'll provide a GitHub repo with starter projects that have genuine performance issues."),
        (1, 3, "Love the real-world approach! How many people are we expecting?"),
        (3, 1, "Last I heard, about 80 registered. We might need to cap it there for the hands-on aspect to work well."),
        (1, 3, "Makes sense. The venue can handle that comfortably. Will you need any special AV setup?"),
        (3, 1, "Just the usual - projector, wireless mic, and strong WiFi for everyone to clone repos."),
        (1, 3, "All covered! Our network team has prepared for high bandwidth usage during workshops."),
        (3, 1, "Excellent! I'm planning to cover React.memo, useMemo, useCallback, and some advanced profiling techniques."),
        (1, 3, "Sounds comprehensive. The real-world examples from Stripe will be incredibly valuable."),
        (3, 1, "That's the goal - practical knowledge they can apply immediately at work."),
        (1, 3, "Perfect! Is there anything else you need from the organizing team?"),
        (3, 1, "Actually, could we get some sticky notes and markers? I like to do some collaborative troubleshooting exercises."),
        (1, 3, "Absolutely! I'll make sure supplies are ready. You're going to be fantastic."),
        (3, 1, "Thanks for the confidence! Looking forward to meeting everyone and sharing some performance optimization tricks."),
        (1, 3, "The community is lucky to have someone with your expertise willing to teach. See you soon!"),
        (3, 1, "See you soon! This is going to be a great conference."),
        
        # Post-workshop follow-up
        (1, 3, "Marcus, your workshop was absolutely incredible! The attendee feedback has been off the charts."),
        (3, 1, "Thank you! The energy in that room was amazing. Everyone was so engaged and asked fantastic questions."),
        (1, 3, "That live debugging session where you optimized that component in real-time - pure magic!"),
        (3, 1, "Ha! That was fun. When I saw the component re-rendering 400 times per second, I knew we had a perfect teaching moment."),
        (1, 3, "The collective 'oooh' from the audience when you fixed it was priceless."),
        (3, 1, "Those moments are why I love teaching. You can see the lightbulb moments happening."),
        (1, 3, "Several people have already reached out asking for the GitHub repo link."),
        (3, 1, "I'll clean it up and make it public this week. Want to add some additional exercises too."),
        (1, 3, "That would be fantastic! Mind if we feature it in our post-conference resources?"),
        (3, 1, "Of course! The more people who can benefit, the better. That's what community is about."),
        (1, 3, "You're the best! Any chance you'd be interested in doing a follow-up webinar series?"),
        (3, 1, "Now that's an interesting idea. Performance optimization is such a deep topic."),
        (1, 3, "We could do a monthly deep-dive series. I bet there'd be huge interest."),
        (3, 1, "Let's definitely explore that! I have tons of material from different performance challenges at Stripe."),
        (1, 3, "Perfect! I'll put together a proposal and we can discuss details."),
        (3, 1, "Sounds great. Thanks for putting together such an amazing conference!"),
        (1, 3, "Thank YOU for making it special. Speakers like you are what make these events memorable."),
    ]
    
    for sender, recipient, content in thread2_messages:
        messages.append({
            "id": message_id,
            "thread_id": 2,
            "sender_id": sender,
            "content": content,
            "encrypted_content": None,
            "status": "READ",
        })
        message_id += 1
    
    # Thread 3: Demo User <-> Chris Martinez (Lead Organizer)
    # Pre-conference coordination - September 2025
    thread3_messages = [
        (8, 1, "Demo! Final logistics check - how are you feeling about tomorrow's opening?"),
        (1, 8, "Chris! Feeling good. Just put the finishing touches on the presentation. The 'Future of Software Development' theme is going to resonate."),
        (8, 1, "Perfect! AV team will be in the main hall at 8:30 AM for sound check and slide testing."),
        (1, 8, "Great, I'll be there at 8:15. How are our registration numbers looking?"),
        (8, 1, "Incredible! We're at 425 in-person attendees and 280+ virtual. Biggest Atria TechConf yet!"),
        (1, 8, "Wow! That's amazing growth. The hybrid format is really working."),
        (8, 1, "Your opening keynote is the most anticipated session. No pressure at all! 😄"),
        (1, 8, "Ha! Thanks for that. But seriously, I'm excited to share the vision. AI, quantum computing, and new development paradigms."),
        (8, 1, "The quantum computing section will be fascinating for this audience."),
        (1, 8, "I'm trying to make it accessible without oversimplifying. Show practical applications developers might see in the next 5 years."),
        (8, 1, "Perfect approach. You always hit that sweet spot between visionary and practical."),
        (1, 8, "Thanks for the confidence boost! How's the speaker green room situation?"),
        (8, 1, "All set! Coffee bar, quiet workspace, and we've got that technical issues corner with the AV support team."),
        (1, 8, "Excellent! Sarah Chen arrived yesterday - she's excited about her distributed systems keynote."),
        (8, 1, "She's incredible! Netflix's scale stories are always mind-blowing. Marcus Rodriguez checked in too."),
        (1, 8, "Perfect! His React performance workshop is packed - we might need overflow seating."),
        (8, 1, "Already arranged! Room B is set up for streaming with interactive Q&A capability."),
        (1, 8, "You think of everything! This is why our conferences run so smoothly."),
        (8, 1, "Team effort! Emily Johnson's DevOps keynote on day 2 is going to be powerful too."),
        (1, 8, "The full speaker lineup is incredible this year. We've really leveled up."),
        (8, 1, "Three days of pure technical excellence. Anything else you need before we kick this off?"),
        (1, 8, "Just good vibes and strong coffee! See you bright and early for what's going to be an amazing event."),
        (8, 1, "Both guaranteed! Let's make some tech conference magic happen! 🚀"),
        
        # During conference coordination
        (8, 1, "Demo! Your opening keynote was absolutely phenomenal! The audience was completely engaged."),
        (1, 8, "Thank you! That standing ovation was unexpected but incredible. The energy in the room was electric."),
        (8, 1, "The quantum computing demos had people's jaws dropping. Perfect balance of future vision and practical timeline."),
        (1, 8, "Glad it landed well! How are the concurrent sessions going?"),
        (8, 1, "All rooms are packed! Marcus's React workshop has a waiting list, and the GraphQL session is getting amazing feedback."),
        (1, 8, "Fantastic! Any logistical issues I should know about?"),
        (8, 1, "All smooth sailing. The overflow streaming is working perfectly, and WiFi is holding strong."),
        (1, 8, "Credit to your planning! The virtual attendee engagement is impressive too."),
        (8, 1, "The chat integration with live sessions is a hit. Real-time Q&A is keeping everyone connected."),
        (1, 8, "That was a great addition this year. How's speaker green room energy?"),
        (8, 1, "Amazing! Lots of cross-pollination happening. Sarah and Emily are already planning collaboration."),
        (1, 8, "That's the magic of bringing the right people together. Community building at its finest."),
        (8, 1, "Exactly! Tomorrow's panels are going to be incredible with all this energy."),
        (1, 8, "Can't wait! This is shaping up to be our best conference yet."),
        (8, 1, "Absolutely! The feedback forms are already coming back with 5-star ratings."),
        (1, 8, "Music to my ears! Thanks for making this all possible, Chris."),
        (8, 1, "Thank YOU for the vision! Now go enjoy the networking session - you've earned it! 🎉"),
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
    
    # Thread 4: Some unread messages
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
            "status": "READ" if message_id < 100 else "SENT",
        })
        message_id += 1
    
    # Thread 5: Demo User <-> Emily Johnson - DevOps Strategy Discussion  
    # November 2025
    thread5_messages = [
        (4, 1, "Demo, your closing keynote about the future of web development was visionary! Still processing all the insights."),
        (1, 4, "Emily! Thank you! Your DevOps evolution keynote was equally impactful. Platform engineering is definitely the future."),
        (4, 1, "The shift from DevOps to platform teams is accelerating faster than I expected. GitOps is becoming table stakes."),
        (1, 4, "Absolutely! The automation and developer experience improvements are game-changing. How's GitHub handling the transition?"),
        (4, 1, "We're seeing incredible adoption of our platform engineering tools. Developers are shipping 2x faster with better reliability."),
        (1, 4, "That's the sweet spot - velocity AND quality. The industry is finally getting this balance right."),
        (4, 1, "Your point about AI-assisted development resonated deeply. We're seeing early experiments that are genuinely promising."),
        (1, 4, "The key is AI as a development accelerator, not replacement. Augmenting human creativity and problem-solving."),
        (4, 1, "Exactly! Code generation is just the beginning. AI-powered testing, monitoring, and incident response are where it gets exciting."),
        (1, 4, "The feedback loops get so much tighter. Imagine AI that learns your codebase and suggests optimizations in real-time."),
        (4, 1, "We're actually prototyping that! Early results show 30% reduction in code review cycles."),
        (1, 4, "Incredible! The productivity gains will compound over time as the AI understands team patterns better."),
        (4, 1, "That's the vision. Speaking of visions, any thoughts on next year's Atria TechConf theme?"),
        (1, 4, "I'm leaning toward 'Human-AI Collaboration in Software Engineering' - practical, not hype-driven."),
        (4, 1, "Perfect! The industry needs more realistic discussions about AI integration rather than replacement fears."),
        (1, 4, "Exactly! Would you be interested in doing a keynote on AI-assisted DevOps workflows?"),
        (4, 1, "I'd be honored! We'll have a year of real production data by then. Should be fascinating insights."),
        (1, 4, "Fantastic! The continuity of having core speakers return with evolved perspectives is powerful."),
        (4, 1, "Building on the conversation from year to year. That's what makes Atria TechConf special."),
        (1, 4, "Community and continuous learning. Looking forward to collaborating on next year's vision!"),
    ]
    
    for sender, recipient, content in thread5_messages:
        messages.append({
            "id": message_id,
            "thread_id": 5,
            "sender_id": sender,
            "content": content,
            "encrypted_content": None,
            "status": "READ",
        })
        message_id += 1
    
    # Thread 6: Demo User <-> Taylor Kim - Data Engineering Discussion
    # December 2025
    thread6_messages = [
        (7, 1, "Demo! Just wanted to circle back on the PostgreSQL scaling session. We implemented those partitioning strategies!"),
        (1, 7, "Taylor! That's awesome! How did the implementation go? Any challenges with the migration?"),
        (7, 1, "Surprisingly smooth! The billion-record migration took 18 hours but zero downtime. Query performance improved 10x."),
        (1, 7, "Incredible results! That session was packed - clearly a pain point many teams were facing."),
        (7, 1, "The real-world examples made all the difference. Theory is nice, but battle-tested strategies are gold."),
        (1, 7, "That's our philosophy for all Atria sessions. Practical knowledge that teams can implement immediately."),
        (7, 1, "It shows! Speaking of data, are you planning any sessions on modern data architectures for next year?"),
        (1, 7, "Funny you mention that - we're exploring a dedicated data track. Real-time pipelines, AI/ML data workflows, the works."),
        (7, 1, "That would be incredible! The intersection of data engineering and AI is exploding right now."),
        (1, 7, "Vector databases, model training pipelines, feature stores - so much evolution happening."),
        (7, 1, "And data governance for AI systems. That's a huge challenge most companies are struggling with."),
        (1, 7, "Great point! Responsible AI starts with responsible data management. Would you be interested in speaking on that?"),
        (7, 1, "Absolutely! DataCorp has been working on some innovative data lineage and privacy-preserving ML techniques."),
        (1, 7, "Perfect! Real-world case studies from production systems are exactly what the community needs."),
        (7, 1, "Happy to share what we've learned - including the mistakes! Those are often the most valuable lessons."),
        (1, 7, "Failure stories are some of our most popular sessions. Authenticity builds trust and accelerates learning."),
        (7, 1, "Count me in for next year! The data engineering community will love having a dedicated track at Atria."),
    ]
    
    for sender, recipient, content in thread6_messages:
        messages.append({
            "id": message_id,
            "thread_id": 6,
            "sender_id": sender,
            "content": content,
            "encrypted_content": None,
            "status": "READ",
        })
        message_id += 1
    
    # Thread 7: Demo User <-> Jamie Wong - DevOps Best Practices
    # January 2026
    thread7_messages = [
        (6, 1, "Demo, the container security best practices session was exactly what our team needed!"),
        (1, 6, "Jamie! So glad it was helpful. Container security is such a critical but often overlooked area."),
        (6, 1, "We audited our entire container pipeline after that session. Found some scary vulnerabilities!"),
        (1, 6, "Better to find them in audit than in production! What was the biggest surprise?"),
        (6, 1, "Base image vulnerabilities we inherited. Switching to distroless images reduced our attack surface by 80%."),
        (1, 6, "Distroless is a game-changer! The security and performance benefits are substantial."),
        (6, 1, "Runtime security scanning caught attempts to install packages in running containers. Wild!"),
        (1, 6, "That's exactly the behavior runtime protection should catch. Threat actors love container breakouts."),
        (6, 1, "The supply chain security discussion was eye-opening too. We're implementing SBOM for all our images."),
        (1, 6, "Software Bill of Materials is becoming essential. Especially with all the recent supply chain attacks."),
        (6, 1, "It's extra work upfront but the visibility and compliance benefits are worth it."),
        (1, 6, "And it's becoming a requirement for many enterprise customers. Better to get ahead of the curve."),
        (6, 1, "Exactly! Any plans for advanced container security topics next year?"),
        (1, 6, "We're considering a dedicated DevSecOps track. Security-first development workflows, shift-left practices."),
        (6, 1, "That would be amazing! The integration of security into CI/CD pipelines is still evolving rapidly."),
        (1, 6, "Would you be interested in sharing TechSolutions' approach to automated security testing?"),
        (6, 1, "Definitely! We've built some interesting tools for policy-as-code and compliance automation."),
        (1, 6, "Perfect! Practical tools and workflows are what the community craves. Let's discuss details soon!"),
    ]
    
    for sender, recipient, content in thread7_messages:
        messages.append({
            "id": message_id,
            "thread_id": 7,
            "sender_id": sender,
            "content": content,
            "encrypted_content": None,
            "status": "READ",
        })
        message_id += 1
    
    return messages
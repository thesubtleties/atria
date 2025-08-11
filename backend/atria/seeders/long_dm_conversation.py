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
        (1, 2, "Good to know. Thanks for all the insights!"),
        (2, 1, "Happy to help! Let's catch up after my talk."),
        (1, 2, "Definitely! Good luck with your session."),
        (2, 1, "Thanks! See you there!"),
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
    
    # Thread 2: Demo User <-> Marcus Rodriguez - Shorter conversation
    thread2_messages = [
        (3, 1, "Thanks for connecting! Excited about the conference."),
        (1, 3, "Me too! Your Kubernetes workshop looks great."),
        (3, 1, "We'll cover a lot of practical examples. Bring your laptop!"),
        (1, 3, "Will do! Any prerequisites I should review?"),
        (3, 1, "Basic Docker knowledge would be helpful, but we'll cover the fundamentals."),
        (1, 3, "Perfect. I've been using Docker for a while."),
        (3, 1, "Great! Then you'll be able to follow the advanced sections too."),
        (1, 3, "Looking forward to the hands-on exercises."),
        (3, 1, "They're the best part. Real clusters, real deployments."),
        (1, 3, "Using cloud providers or local?"),
        (3, 1, "Cloud. We have credits for everyone."),
        (1, 3, "Excellent! See you at the workshop."),
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
    
    # Thread 3: Demo User <-> Chris Martinez (Organizer)
    thread3_messages = [
        (8, 1, "Hey! Everything ready for your keynote?"),
        (1, 8, "Yes! Just finished the final slides. Thanks for checking in."),
        (8, 1, "Perfect. AV team will be ready 30 min early for setup."),
        (1, 8, "Great, I'll be there. How's registration looking?"),
        (8, 1, "We're at 380 in-person and 200+ virtual. Great turnout!"),
        (1, 8, "That's amazing! This is going to be a great event."),
        (8, 1, "Your keynote is highly anticipated. No pressure 😄"),
        (1, 8, "Ha! I'll do my best. The topic resonates with many."),
        (8, 1, "Future of software development - perfect opening."),
        (1, 8, "I'm covering AI, quantum, and new paradigms."),
        (8, 1, "The quantum section will be interesting!"),
        (1, 8, "Trying to make it accessible without dumbing down."),
        (8, 1, "That's the sweet spot. You'll nail it."),
        (1, 8, "Thanks for the confidence boost!"),
        (8, 1, "Anytime! Need anything else before tomorrow?"),
        (1, 8, "All good. See you bright and early!"),
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
    
    return messages
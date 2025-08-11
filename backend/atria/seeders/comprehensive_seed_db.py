# seeders/comprehensive_seed_db.py
from flask import current_app
from api.extensions import db
from api.app import create_app
from sqlalchemy import text
from sqlalchemy.sql import quoted_name
import json
from datetime import datetime, timedelta

# Import all comprehensive seed functions
from .comprehensive_seed_data import (
    generate_users,
    generate_organizations,
    generate_organization_users,
    generate_events,
    generate_event_users,
    generate_sessions,
    generate_session_speakers,
    generate_sponsors,
    generate_chat_rooms,
    generate_chat_messages,
    generate_connections,
    generate_direct_message_threads,
    generate_direct_messages,
    generate_user_encryption_keys,
)


def seed_comprehensive_database():
    """Seed database with comprehensive test data including 75+ users"""
    app = create_app()
    with app.app_context():
        try:
            print("=" * 60)
            print("COMPREHENSIVE DATABASE SEEDING")
            print("=" * 60)
            
            # Clear existing data
            print("\n[1/14] Clearing existing data...")
            tables_to_clear = [
                "direct_messages",
                "direct_message_threads",
                "connections",
                "chat_messages",
                "chat_rooms",
                "session_speakers",
                "sessions",
                "sponsors",
                "event_users",
                "events",
                "organization_users",
                "organizations",
                "user_encryption_keys",
                "users",
            ]
            
            for table in tables_to_clear:
                db.session.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
            db.session.commit()
            print("  ✓ All tables cleared")

            # Seed users
            print("\n[2/14] Seeding users...")
            users = generate_users()
            for user_data in users:
                user_data = dict(user_data)
                user_data["social_links"] = json.dumps(user_data["social_links"])
                
                db.session.execute(
                    text("""
                        INSERT INTO users (
                            id, email, password_hash, first_name, last_name,
                            company_name, title, bio, image_url, social_links,
                            is_active, email_verified, created_at
                        )
                        VALUES (
                            :id, :email, :password_hash, :first_name, :last_name,
                            :company_name, :title, :bio, :image_url, :social_links,
                            :is_active, :email_verified, CURRENT_TIMESTAMP
                        )
                    """),
                    user_data,
                )
            db.session.commit()
            print(f"  ✓ Created {len(users)} users")

            # Seed organizations
            print("\n[3/14] Seeding organizations...")
            orgs = generate_organizations()
            for org_data in orgs:
                db.session.execute(
                    text("""
                        INSERT INTO organizations (id, name, created_at)
                        VALUES (:id, :name, :created_at)
                    """),
                    org_data,
                )
            db.session.commit()
            print(f"  ✓ Created {len(orgs)} organizations")

            # Seed organization users
            print("\n[4/14] Seeding organization memberships...")
            org_users = generate_organization_users()
            for org_user_data in org_users:
                db.session.execute(
                    text("""
                        INSERT INTO organization_users (organization_id, user_id, role, created_at)
                        VALUES (:organization_id, :user_id, :role, CURRENT_TIMESTAMP)
                    """),
                    org_user_data,
                )
            db.session.commit()
            print(f"  ✓ Created {len(org_users)} organization memberships")

            # Seed events
            print("\n[5/14] Seeding events...")
            events = generate_events()
            for event_data in events:
                event_data = dict(event_data)
                event_data["branding"] = json.dumps(event_data["branding"])
                event_data["hero_images"] = json.dumps(event_data["hero_images"])
                event_data["sections"] = json.dumps(event_data["sections"])
                # Icebreakers field exists in the migration
                if "icebreakers" in event_data:
                    event_data["icebreakers"] = json.dumps(event_data["icebreakers"])
                if event_data.get("sponsor_tiers"):
                    event_data["sponsor_tiers"] = json.dumps(event_data["sponsor_tiers"])
                
                db.session.execute(
                    text("""
                        INSERT INTO events (
                            id, organization_id, title, description,
                            hero_description, hero_images,
                            event_type, event_format, is_private,
                            venue_name, venue_address, venue_city, venue_country,
                            start_date, end_date, company_name,
                            slug, status, branding, sections, sponsor_tiers, 
                            icebreakers, created_at
                        )
                        VALUES (
                            :id, :organization_id, :title, :description,
                            :hero_description, :hero_images,
                            :event_type, :event_format, :is_private,
                            :venue_name, :venue_address, :venue_city, :venue_country,
                            :start_date, :end_date, :company_name,
                            :slug, :status, :branding, :sections, :sponsor_tiers,
                            :icebreakers, CURRENT_TIMESTAMP
                        )
                    """),
                    event_data,
                )
            db.session.commit()
            print(f"  ✓ Created {len(events)} events")
            print(f"    • Event 1: 75 attendees (main demo)")
            print(f"    • Event 2: 20 attendees (medium)")
            print(f"    • Event 3: 8 attendees (small)")

            # Seed event users
            print("\n[6/14] Seeding event attendees...")
            event_users = generate_event_users()
            for event_user_data in event_users:
                db.session.execute(
                    text("""
                        INSERT INTO event_users (
                            event_id, user_id, role,
                            speaker_title, speaker_bio, created_at
                        )
                        VALUES (
                            :event_id, :user_id, :role,
                            :speaker_title, :speaker_bio, CURRENT_TIMESTAMP
                        )
                    """),
                    event_user_data,
                )
            db.session.commit()
            
            # Count roles for reporting
            admins = len([eu for eu in event_users if eu["role"] == "ADMIN"])
            organizers = len([eu for eu in event_users if eu["role"] == "ORGANIZER"])
            speakers = len([eu for eu in event_users if eu["role"] == "SPEAKER"])
            attendees = len([eu for eu in event_users if eu["role"] == "ATTENDEE"])
            
            print(f"  ✓ Created {len(event_users)} event memberships")
            print(f"    • {admins} admins, {organizers} organizers")
            print(f"    • {speakers} speakers, {attendees} attendees")

            # Seed sessions
            print("\n[7/14] Seeding sessions...")
            sessions = generate_sessions()
            for session_data in sessions:
                db.session.execute(
                    text("""
                        INSERT INTO sessions (
                            id, event_id, status, session_type, chat_mode,
                            title, short_description, description, 
                            start_time, end_time, stream_url, day_number, created_at
                        )
                        VALUES (
                            :id, :event_id, :status, :session_type, 'ENABLED',
                            :title, :short_description, :description, 
                            :start_time, :end_time, :stream_url, :day_number, 
                            CURRENT_TIMESTAMP
                        )
                    """),
                    session_data,
                )
            db.session.commit()
            print(f"  ✓ Created {len(sessions)} sessions")

            # Seed session speakers
            print("\n[8/14] Seeding session speakers...")
            session_speakers = generate_session_speakers()
            for speaker_data in session_speakers:
                db.session.execute(
                    text("""
                        INSERT INTO session_speakers (
                            session_id, user_id, role, "order", created_at
                        )
                        VALUES (
                            :session_id, :user_id, :role, :order, CURRENT_TIMESTAMP
                        )
                    """),
                    speaker_data,
                )
            db.session.commit()
            print(f"  ✓ Assigned {len(session_speakers)} speakers to sessions")

            # Seed sponsors
            print("\n[9/14] Seeding sponsors...")
            sponsors = generate_sponsors()
            for sponsor_data in sponsors:
                sponsor_data = dict(sponsor_data)
                if "social_links" in sponsor_data:
                    sponsor_data["social_links"] = json.dumps(sponsor_data["social_links"])
                
                db.session.execute(
                    text("""
                        INSERT INTO sponsors (
                            id, event_id, name, description, website_url,
                            logo_url, tier_id, display_order, is_active, 
                            featured, social_links, created_at
                        )
                        VALUES (
                            :id, :event_id, :name, :description, :website_url,
                            :logo_url, :tier_id, :display_order, :is_active, 
                            :featured, :social_links, CURRENT_TIMESTAMP
                        )
                    """),
                    sponsor_data,
                )
            db.session.commit()
            print(f"  ✓ Created {len(sponsors)} sponsors")

            # Seed chat rooms
            print("\n[10/14] Seeding chat rooms...")
            chat_rooms = generate_chat_rooms()
            for chat_room_data in chat_rooms:
                db.session.execute(
                    text("""
                        INSERT INTO chat_rooms (
                            id, event_id, session_id, name, description, 
                            room_type, is_enabled, display_order, created_at
                        )
                        VALUES (
                            :id, :event_id, :session_id, :name, :description, 
                            :room_type, :is_enabled, :display_order, CURRENT_TIMESTAMP
                        )
                    """),
                    chat_room_data,
                )
            db.session.commit()
            
            # Count room types
            global_rooms = len([r for r in chat_rooms if r["room_type"] == "GLOBAL"])
            green_rooms = len([r for r in chat_rooms if r["room_type"] == "GREEN_ROOM"])
            admin_rooms = len([r for r in chat_rooms if r["room_type"] == "ADMIN"])
            public_rooms = len([r for r in chat_rooms if r["room_type"] == "PUBLIC"])
            backstage_rooms = len([r for r in chat_rooms if r["room_type"] == "BACKSTAGE"])
            
            print(f"  ✓ Created {len(chat_rooms)} chat rooms")
            print(f"    • {global_rooms} global, {green_rooms} green room, {admin_rooms} admin")
            print(f"    • {public_rooms} public session, {backstage_rooms} backstage")

            # Seed chat messages with incremental timestamps
            print("\n[11/14] Seeding chat messages...")
            chat_messages = generate_chat_messages()
            base_time = datetime.now() - timedelta(hours=2)  # Start messages 2 hours ago
            for i, message_data in enumerate(chat_messages):
                # Add 30 seconds between each message for realistic timing
                message_timestamp = base_time + timedelta(seconds=i * 30)
                db.session.execute(
                    text("""
                        INSERT INTO chat_messages (id, room_id, user_id, content, created_at)
                        VALUES (:id, :room_id, :user_id, :content, :timestamp)
                    """),
                    {**message_data, "timestamp": message_timestamp},
                )
            db.session.commit()
            print(f"  ✓ Created {len(chat_messages)} chat messages")

            # Seed connections
            print("\n[12/14] Seeding user connections...")
            connections = generate_connections()
            for connection_data in connections:
                db.session.execute(
                    text("""
                        INSERT INTO connections (
                            id, requester_id, recipient_id, status, 
                            icebreaker_message, originating_event_id, created_at
                        )
                        VALUES (
                            :id, :requester_id, :recipient_id, :status, 
                            :icebreaker_message, :originating_event_id, CURRENT_TIMESTAMP
                        )
                    """),
                    connection_data,
                )
            db.session.commit()
            
            # Count connection states
            accepted = len([c for c in connections if c["status"] == "ACCEPTED"])
            pending = len([c for c in connections if c["status"] == "PENDING"])
            rejected = len([c for c in connections if c["status"] == "REJECTED"])
            
            print(f"  ✓ Created {len(connections)} connections")
            print(f"    • {accepted} accepted, {pending} pending, {rejected} rejected")

            # Seed direct message threads
            print("\n[13/14] Seeding direct message threads...")
            dm_threads = generate_direct_message_threads()
            for thread_data in dm_threads:
                db.session.execute(
                    text("""
                        INSERT INTO direct_message_threads (
                            id, user1_id, user2_id, is_encrypted, 
                            created_at, last_message_at
                        )
                        VALUES (
                            :id, :user1_id, :user2_id, :is_encrypted, 
                            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                        )
                    """),
                    thread_data,
                )
            db.session.commit()
            print(f"  ✓ Created {len(dm_threads)} DM threads")

            # Seed direct messages with incremental timestamps
            print("\n[14/14] Seeding direct messages...")
            direct_messages = generate_direct_messages()
            dm_base_time = datetime.now() - timedelta(days=1)  # Start DMs 1 day ago
            for i, message_data in enumerate(direct_messages):
                if "encrypted_content" not in message_data:
                    message_data["encrypted_content"] = None
                
                # Add 2 hours between each DM for realistic timing
                dm_timestamp = dm_base_time + timedelta(hours=i * 2)
                
                db.session.execute(
                    text("""
                        INSERT INTO direct_messages (
                            id, thread_id, sender_id, content, 
                            encrypted_content, status, created_at
                        )
                        VALUES (
                            :id, :thread_id, :sender_id, :content, 
                            :encrypted_content, :status, :timestamp
                        )
                    """),
                    {**message_data, "timestamp": dm_timestamp},
                )
            db.session.commit()
            print(f"  ✓ Created {len(direct_messages)} direct messages")

            # Reset sequences
            print("\n[FINAL] Resetting sequences...")
            sequences_to_reset = [
                ("users_id_seq", "users"),
                ("organizations_id_seq", "organizations"),
                ("events_id_seq", "events"),
                ("sessions_id_seq", "sessions"),
                ("sponsors_id_seq", "sponsors"),
                ("chat_rooms_id_seq", "chat_rooms"),
                ("chat_messages_id_seq", "chat_messages"),
                ("connections_id_seq", "connections"),
                ("direct_message_threads_id_seq", "direct_message_threads"),
                ("direct_messages_id_seq", "direct_messages"),
            ]
            
            for seq_name, table_name in sequences_to_reset:
                try:
                    # Validate identifiers
                    if not all(c.isalnum() or c == '_' for c in seq_name):
                        raise ValueError(f"Invalid sequence name: {seq_name}")
                    if not all(c.isalnum() or c == '_' for c in table_name):
                        raise ValueError(f"Invalid table name: {table_name}")
                    
                    query = text(f"""
                        SELECT setval('"{seq_name}"'::regclass, 
                            (SELECT COALESCE(MAX(id), 0) FROM "{table_name}") + 1, 
                            false
                        )
                    """)
                    db.session.execute(query)
                except Exception as e:
                    print(f"  ⚠ Warning: Could not reset sequence {seq_name}: {str(e)}")
            
            db.session.commit()
            print("  ✓ Sequences reset")

            print("\n" + "=" * 60)
            print("✨ COMPREHENSIVE DATABASE SEEDING COMPLETE!")
            print("=" * 60)
            print("\n📊 Summary:")
            print(f"  • {len(users)} users created")
            print(f"  • {len(orgs)} organizations")
            print(f"  • {len(events)} events (75, 20, and 8 attendees)")
            print(f"  • {len(sessions)} sessions across all events")
            print(f"  • {len(chat_rooms)} chat rooms with permission-based access")
            print(f"  • {len(connections)} user connections")
            print(f"  • {len(dm_threads)} DM conversations")
            print("\n🔑 Demo Account:")
            print("  Email: demouser@demo.com")
            print("  Password: changeme")
            print("  Role: Platform Owner & Event Admin")
            print("\n⚠️  Note: All user emails are manually verified to avoid bounce issues")
            print("=" * 60)

        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Error seeding database: {str(e)}")
            raise e


if __name__ == "__main__":
    seed_comprehensive_database()
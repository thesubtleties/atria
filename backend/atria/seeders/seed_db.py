# seeders/seed_db.py
from flask import current_app
from api.extensions import db
from api.app import create_app
from sqlalchemy import text
import json

# Import all seed functions directly
from .seed_data import (
    seed_users,
    seed_organizations,
    seed_organization_users,
    seed_events,
    seed_event_users,
    seed_sessions,
    seed_session_speakers,
    seed_chat_rooms,
    seed_chat_messages,
    seed_connections,
    seed_direct_message_threads,
    seed_direct_messages,
    seed_user_encryption_keys,
)


def seed_database():
    app = create_app()
    with app.app_context():
        try:
            print("Clearing existing data...")
            db.session.execute(text("TRUNCATE TABLE users CASCADE"))
            db.session.execute(text("TRUNCATE TABLE organizations CASCADE"))
            db.session.execute(text("TRUNCATE TABLE events CASCADE"))
            db.session.execute(text("TRUNCATE TABLE sessions CASCADE"))
            db.session.execute(text("TRUNCATE TABLE chat_rooms CASCADE"))
            db.session.execute(text("TRUNCATE TABLE connections CASCADE"))
            db.session.execute(
                text("TRUNCATE TABLE direct_message_threads CASCADE")
            )
            db.session.execute(
                text("TRUNCATE TABLE user_encryption_keys CASCADE")
            )
            db.session.commit()

            print("Seeding users...")
            for user_data in seed_users():
                # Convert dict to JSON string
                user_data = dict(user_data)  # Make a copy
                user_data["social_links"] = json.dumps(
                    user_data["social_links"]
                )

                db.session.execute(
                    text(
                        """
                    INSERT INTO users (id, email, password_hash, first_name, last_name,
                                     company_name, title, bio, image_url, social_links,
                                     is_active, created_at)
                    VALUES (:id, :email, :password_hash, :first_name, :last_name,
                           :company_name, :title, :bio, :image_url, :social_links,
                           :is_active, CURRENT_TIMESTAMP)
                    """
                    ),
                    user_data,
                )

            print("Seeding organizations...")
            for org_data in seed_organizations():
                db.session.execute(
                    text(
                        """
                    INSERT INTO organizations (id, name, created_at)
                    VALUES (:id, :name, :created_at)
                    """
                    ),
                    org_data,
                )

            print("Seeding organization users...")
            for org_user_data in seed_organization_users():
                db.session.execute(
                    text(
                        """
                    INSERT INTO organization_users (organization_id, user_id, role, created_at)
                    VALUES (:organization_id, :user_id, :role, CURRENT_TIMESTAMP)
                    """
                    ),
                    org_user_data,
                )

            print("Seeding events...")
            for event_data in seed_events():
                # Convert JSON fields to strings
                event_data = dict(event_data)  # Make a copy
                event_data["branding"] = json.dumps(event_data["branding"])
                event_data["hero_images"] = json.dumps(
                    event_data["hero_images"]
                )
                event_data["sections"] = json.dumps(event_data["sections"])

                db.session.execute(
                    text(
                        """
                        INSERT INTO events (
                            id, organization_id, title, description,
                            hero_description, hero_images,
                            event_type, event_format, is_private,
                            venue_name, venue_address, venue_city, venue_country,
                            start_date, end_date, company_name,
                            slug, status, branding, sections, created_at
                        )
                        VALUES (
                            :id, :organization_id, :title, :description,
                            :hero_description, :hero_images,
                            :event_type, :event_format, :is_private,
                            :venue_name, :venue_address, :venue_city, :venue_country,
                            :start_date, :end_date, :company_name,
                            :slug, :status, :branding, :sections, CURRENT_TIMESTAMP
                        )
                        """
                    ),
                    event_data,
                )

            print("Seeding event users...")
            for event_user_data in seed_event_users():
                db.session.execute(
                    text(
                        """
                    INSERT INTO event_users (event_id, user_id, role,
                                           speaker_title, speaker_bio, created_at)
                    VALUES (:event_id, :user_id, :role,
                           :speaker_title, :speaker_bio, CURRENT_TIMESTAMP)
                    """
                    ),
                    event_user_data,
                )

            print("Seeding sessions...")
            for session_data in seed_sessions():
                db.session.execute(
                    text(
                        """
                    INSERT INTO sessions (id, event_id, status, session_type,
                                        title, description, start_time, end_time,
                                        stream_url, day_number, created_at)
                    VALUES (:id, :event_id, :status, :session_type,
                           :title, :description, :start_time, :end_time,
                           :stream_url, :day_number, CURRENT_TIMESTAMP)
                    """
                    ),
                    session_data,
                )

            print("Seeding session speakers...")
            for speaker_data in seed_session_speakers():
                db.session.execute(
                    text(
                        """
                    INSERT INTO session_speakers (session_id, user_id, role,
                                                "order", created_at)
                    VALUES (:session_id, :user_id, :role,
                           :order, CURRENT_TIMESTAMP)
                    """
                    ),
                    speaker_data,
                )

            print("Seeding chat rooms...")
            for chat_room_data in seed_chat_rooms():
                db.session.execute(
                    text(
                        """
                    INSERT INTO chat_rooms (id, event_id, name, description, is_global, created_at)
                    VALUES (:id, :event_id, :name, :description, :is_global, CURRENT_TIMESTAMP)
                    """
                    ),
                    chat_room_data,
                )

            print("Seeding chat messages...")
            for message_data in seed_chat_messages():
                db.session.execute(
                    text(
                        """
                    INSERT INTO chat_messages (id, room_id, user_id, content, created_at)
                    VALUES (:id, :room_id, :user_id, :content, CURRENT_TIMESTAMP)
                    """
                    ),
                    message_data,
                )

            print("Seeding connections...")
            for connection_data in seed_connections():
                db.session.execute(
                    text(
                        """
                    INSERT INTO connections (id, requester_id, recipient_id, status, 
                                        icebreaker_message, originating_event_id, created_at)
                    VALUES (:id, :requester_id, :recipient_id, :status, 
                        :icebreaker_message, :originating_event_id, CURRENT_TIMESTAMP)
                    """
                    ),
                    connection_data,
                )

            print("Seeding direct message threads...")
            for thread_data in seed_direct_message_threads():
                db.session.execute(
                    text(
                        """
                    INSERT INTO direct_message_threads (id, user1_id, user2_id, is_encrypted, 
                                                    created_at, last_message_at)
                    VALUES (:id, :user1_id, :user2_id, :is_encrypted, 
                        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """
                    ),
                    thread_data,
                )

            print("Seeding direct messages...")
            for message_data in seed_direct_messages():
                # Handle encrypted_content which might be None
                if "encrypted_content" not in message_data:
                    message_data["encrypted_content"] = None

                db.session.execute(
                    text(
                        """
                    INSERT INTO direct_messages (id, thread_id, sender_id, content, 
                                            encrypted_content, status, created_at)
                    VALUES (:id, :thread_id, :sender_id, :content, 
                        :encrypted_content, :status, CURRENT_TIMESTAMP)
                    """
                    ),
                    message_data,
                )

            print("Seeding user encryption keys...")
            for key_data in seed_user_encryption_keys():
                db.session.execute(
                    text(
                        """
                    INSERT INTO user_encryption_keys (id, user_id, public_key, created_at)
                    VALUES (:id, :user_id, :public_key, CURRENT_TIMESTAMP)
                    """
                    ),
                    key_data,
                )

            db.session.commit()
            print("Database seeded successfully!")

        except Exception as e:
            db.session.rollback()
            print(f"Error seeding database: {str(e)}")
            raise e


if __name__ == "__main__":
    seed_database()

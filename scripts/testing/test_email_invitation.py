#!/usr/bin/env python3
"""Test script for email invitations"""

import requests
import json
from datetime import datetime

# Base URL for the API
BASE_URL = "http://localhost:5000/api"

# Test credentials - using seeded demo user
TEST_USER = {"email": "demouser@demo.com", "password": "changeme"}


def login():
    """Login and get JWT token from cookies"""
    # Create a session to persist cookies
    session = requests.Session()
    print(f"Attempting login with: {TEST_USER['email']}")
    response = session.post(f"{BASE_URL}/auth/login", json=TEST_USER)
    if response.status_code == 200:
        data = response.json()
        print(f"Login response: {data}")
        # Return the session object with cookies
        return session
    else:
        print(f"Login failed: {response.status_code}")
        try:
            print(response.json())
        except:
            print(response.text)
        return None


def send_invitation(session, event_id):
    """Send an event invitation"""
    headers = {"Content-Type": "application/json"}

    invitation_data = {
        "email": "testing@sbtl.ai",
        "role": "ATTENDEE",
        "message": "You're invited to our awesome event!",
    }

    response = session.post(
        f"{BASE_URL}/events/{event_id}/invitations",
        headers=headers,
        json=invitation_data,
    )

    print(f"Invitation Response Status: {response.status_code}")
    if response.status_code in [200, 201]:
        print("Invitation sent successfully!")
        print(json.dumps(response.json(), indent=2))
    else:
        print("Failed to send invitation:")
        print(response.text)


def main():
    print(f"Testing email invitations at {datetime.now()}")
    print("-" * 50)

    # Login
    print("Logging in...")
    session = login()
    if not session:
        print("Failed to login. Exiting.")
        return

    print("Login successful!")
    print("-" * 50)

    # Use event_id=1 for testing (we verified it exists)
    event_id = 1

    print(f"Sending invitation for event={event_id}")
    send_invitation(session, event_id)


if __name__ == "__main__":
    main()

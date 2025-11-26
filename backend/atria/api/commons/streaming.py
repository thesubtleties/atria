"""
Utilities for streaming platform URL/ID normalization.

These utilities extract platform-specific identifiers from various input formats,
allowing users to paste full URLs or raw IDs/meeting codes.
"""
import re
from typing import Optional
from urllib.parse import urlparse


def extract_vimeo_id(url_or_id: str) -> Optional[str]:
    """
    Extract video ID from Vimeo URL or validate raw ID.

    Accepts:
    - Full URL: https://vimeo.com/123456789
    - Player URL: https://player.vimeo.com/video/123456789
    - Raw ID: 123456789

    Args:
        url_or_id: Vimeo URL or video ID

    Returns:
        Video ID string, or None if invalid format

    Examples:
        >>> extract_vimeo_id("https://vimeo.com/123456789")
        "123456789"
        >>> extract_vimeo_id("123456789")
        "123456789"
    """
    if not url_or_id:
        return None

    value = url_or_id.strip()

    # Check if it's already just a numeric ID
    if re.match(r'^\d+$', value):
        return value

    # Extract from various Vimeo URL formats
    patterns = [
        r'vimeo\.com/(\d+)',                    # https://vimeo.com/123456789
        r'player\.vimeo\.com/video/(\d+)',      # https://player.vimeo.com/video/123456789
    ]

    for pattern in patterns:
        match = re.search(pattern, value)
        if match:
            return match.group(1)

    return None


def extract_mux_playback_id(url_or_id: str) -> Optional[str]:
    """
    Extract Playback ID from Mux URL or validate raw ID.

    Accepts:
    - Stream URL: https://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe.m3u8
    - Playback ID: DS00Spx1CV902MCtPj5WknGlR102V5HFkDe

    Args:
        url_or_id: Mux stream URL or playback ID

    Returns:
        Playback ID string, or None if invalid format

    Examples:
        >>> extract_mux_playback_id("https://stream.mux.com/DS00Spx1....m3u8")
        "DS00Spx1..."
        >>> extract_mux_playback_id("DS00Spx1CV902MCtPj5WknGlR102V5HFkDe")
        "DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"
    """
    if not url_or_id:
        return None

    value = url_or_id.strip()

    # Check if it's a Mux URL (must be from actual Mux domains)
    if 'stream.mux.com' in value or 'image.mux.com' in value:
        # Extract from: https://stream.mux.com/{PLAYBACK_ID}.m3u8
        match = re.search(r'stream\.mux\.com/([a-zA-Z0-9]+)(?:\.m3u8)?', value)
        if match:
            playback_id = match.group(1)
            # Validate extracted ID length
            if len(playback_id) >= 10:
                return playback_id

        # Try generic mux.com pattern (for image URLs, etc.)
        match = re.search(r'mux\.com/([a-zA-Z0-9]+)', value)
        if match:
            playback_id = match.group(1)
            # Validate extracted ID length
            if len(playback_id) >= 10:
                return playback_id

    # Assume it's already a Playback ID - validate format
    # Mux Playback IDs are alphanumeric, typically 20-50 characters
    if re.match(r'^[a-zA-Z0-9]{10,100}$', value):
        return value

    return None


def normalize_zoom_url(url_or_id: str) -> Optional[str]:
    """
    Normalize Zoom meeting ID or URL to full join URL.

    Accepts:
    - Full URL: https://zoom.us/j/1234567890
    - Full URL with password: https://zoom.us/j/1234567890?pwd=abc123
    - Meeting ID (with spaces): 123 456 7890
    - Meeting ID (with dashes): 123-456-7890
    - Meeting ID (raw): 1234567890

    Args:
        url_or_id: Zoom meeting URL or ID

    Returns:
        Full Zoom join URL, or None if invalid format

    Examples:
        >>> normalize_zoom_url("https://zoom.us/j/1234567890?pwd=abc")
        "https://zoom.us/j/1234567890?pwd=abc"
        >>> normalize_zoom_url("123 456 7890")
        "https://zoom.us/j/1234567890"
        >>> normalize_zoom_url("1234567890")
        "https://zoom.us/j/1234567890"
    """
    if not url_or_id:
        return None

    value = url_or_id.strip()

    # If it's already a full URL, keep it (may have password param)
    if value.startswith('http'):
        # Validate it's a Zoom URL
        if 'zoom.us' in value or 'zoom.com' in value:
            return value
        return None

    # Extract digits only (remove spaces, dashes, etc.)
    meeting_id = re.sub(r'\D', '', value)

    if not meeting_id:
        return None

    # Validate meeting ID length (Zoom IDs are typically 9-11 digits)
    if len(meeting_id) < 9 or len(meeting_id) > 11:
        return None

    # Build standard Zoom join URL
    return f"https://zoom.us/j/{meeting_id}"


def normalize_jitsi_room_name(input_str: str) -> Optional[str]:
    """
    Normalize Jitsi room name to URL-safe format.

    Accepts:
    - Full JaaS URL: https://8x8.vc/vpaas-magic-cookie-xxx/MyRoom
    - Room name with spaces: "My Event Room"
    - Already normalized: "my-event-room"

    Args:
        input_str: Jitsi room URL or name

    Returns:
        Normalized room name (lowercase, alphanumeric + dashes), or None if invalid

    Examples:
        >>> normalize_jitsi_room_name("My Event Room!")
        "my-event-room"
        >>> normalize_jitsi_room_name("https://8x8.vc/app/MyRoom123")
        "myroom123"
        >>> normalize_jitsi_room_name("already-good-123")
        "already-good-123"
    """
    if not input_str:
        return None

    value = input_str.strip()

    # If it's a URL, extract the room name from the path
    if value.startswith('http'):
        # Use urlparse to properly handle query strings and fragments
        # Handles: https://8x8.vc/vpaas-magic-cookie-xxx/MyRoom
        #          https://meet.jit.si/MyRoom?config=...
        parsed = urlparse(value)
        path = parsed.path  # Gets path without query string

        # Extract last non-empty path segment
        segments = [s for s in path.split('/') if s]
        if not segments:
            return None  # No path segments (e.g., https://8x8.vc/)
        value = segments[-1]

    # Convert to lowercase
    value = value.lower()

    # Replace spaces and underscores with dashes
    value = re.sub(r'[\s_]+', '-', value)

    # Remove any characters that aren't alphanumeric or dashes
    value = re.sub(r'[^a-z0-9-]', '', value)

    # Remove consecutive dashes
    value = re.sub(r'-+', '-', value)

    # Remove leading/trailing dashes
    value = value.strip('-')

    # Validate length (room names should be reasonable)
    if not value or len(value) < 3 or len(value) > 200:
        return None

    return value


def validate_other_stream_url(url: str) -> Optional[str]:
    """
    Validate URL format for OTHER streaming platform.

    Requires HTTPS URL format for security.

    Args:
        url: External streaming platform URL

    Returns:
        Validated URL, or None if invalid

    Examples:
        >>> validate_other_stream_url("https://teams.microsoft.com/l/meetup-join/...")
        "https://teams.microsoft.com/l/meetup-join/..."
        >>> validate_other_stream_url("http://example.com")
        None  # HTTP not allowed
        >>> validate_other_stream_url("not-a-url")
        None
    """
    if not url:
        return None

    value = url.strip()

    # Must start with https://
    if not value.startswith('https://'):
        return None

    # Basic URL validation (has a domain with at least one dot)
    # Pattern: https:// + domain (with required TLD) + optional port + optional path
    # Changes from original:
    #   - Changed * to + to require at least one dot (TLD required)
    #   - Added (?::[0-9]{1,5})? to allow optional port numbers
    url_pattern = r'^https://[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?::[0-9]{1,5})?(/.*)?$'

    if not re.match(url_pattern, value):
        return None

    # Validate length
    if len(value) > 2000:
        return None

    return value

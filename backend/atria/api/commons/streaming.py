"""
Utilities for streaming platform URL/ID normalization.

These utilities extract platform-specific identifiers from various input formats,
allowing users to paste full URLs or raw IDs/meeting codes.
"""
import re
from typing import Optional


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

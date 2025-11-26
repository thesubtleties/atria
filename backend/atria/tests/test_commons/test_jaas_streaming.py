"""
Tests for Jitsi and Other platform streaming utilities (api/commons/streaming.py).

Tests URL/ID extraction and normalization for Jitsi (JaaS) and OTHER platform support.
Used by schemas to normalize user input before saving to database.
"""
import pytest
from api.commons.streaming import normalize_jitsi_room_name, validate_other_stream_url


class TestJitsiRoomNormalization:
    """Test Jitsi room name extraction and normalization"""

    def test_normalize_simple_room_name(self):
        """Normalize simple room name to lowercase"""
        room_name = "MyEventRoom"
        result = normalize_jitsi_room_name(room_name)
        assert result == "myeventroom"

    def test_normalize_room_name_with_spaces(self):
        """Convert spaces to dashes"""
        room_name = "My Event Room"
        result = normalize_jitsi_room_name(room_name)
        assert result == "my-event-room"

    def test_normalize_room_name_with_special_chars(self):
        """Remove special characters"""
        room_name = "My Event Room!"
        result = normalize_jitsi_room_name(room_name)
        assert result == "my-event-room"

    def test_normalize_room_name_with_underscores(self):
        """Convert underscores to dashes"""
        room_name = "my_event_room"
        result = normalize_jitsi_room_name(room_name)
        assert result == "my-event-room"

    def test_normalize_already_normalized(self):
        """Keep already normalized room names as-is"""
        room_name = "already-good-123"
        result = normalize_jitsi_room_name(room_name)
        assert result == "already-good-123"

    def test_normalize_alphanumeric_with_numbers(self):
        """Preserve numbers in room names"""
        room_name = "Event2024Room123"
        result = normalize_jitsi_room_name(room_name)
        assert result == "event2024room123"

    def test_extract_from_jaas_url(self):
        """Extract room name from JaaS URL (8x8.vc)"""
        url = "https://8x8.vc/vpaas-magic-cookie-abc123/MyEventRoom"
        result = normalize_jitsi_room_name(url)
        assert result == "myeventroom"

    def test_extract_from_meet_jitsi_url(self):
        """Extract room name from meet.jit.si URL"""
        url = "https://meet.jit.si/MyEventRoom123"
        result = normalize_jitsi_room_name(url)
        assert result == "myeventroom123"

    def test_extract_from_url_with_trailing_slash(self):
        """Handle URLs with trailing slash"""
        url = "https://8x8.vc/app/MyRoom/"
        result = normalize_jitsi_room_name(url)
        assert result == "myroom"

    def test_extract_from_url_with_query_params(self):
        """Extract room name ignoring query parameters"""
        url = "https://meet.jit.si/MyRoom?config.startWithAudioMuted=true"
        result = normalize_jitsi_room_name(url)
        # Query params are stripped by urlparse, only room name remains
        assert result == "myroom"

    def test_normalize_consecutive_spaces(self):
        """Collapse consecutive spaces to single dash"""
        room_name = "My    Event    Room"
        result = normalize_jitsi_room_name(room_name)
        assert result == "my-event-room"

    def test_normalize_consecutive_dashes(self):
        """Collapse consecutive dashes to single dash"""
        room_name = "my---event---room"
        result = normalize_jitsi_room_name(room_name)
        assert result == "my-event-room"

    def test_normalize_leading_trailing_dashes(self):
        """Remove leading and trailing dashes"""
        room_name = "-my-room-"
        result = normalize_jitsi_room_name(room_name)
        assert result == "my-room"

    def test_normalize_mixed_special_chars(self):
        """Remove mixed special characters (only spaces/underscores become dashes)"""
        room_name = "Tech@Summit#2024!"
        result = normalize_jitsi_room_name(room_name)
        # Special chars (@, #, !) are removed entirely, not converted to dashes
        assert result == "techsummit2024"

    def test_normalize_with_whitespace(self):
        """Handle input with leading/trailing whitespace"""
        room_name = "  MyRoom  "
        result = normalize_jitsi_room_name(room_name)
        assert result == "myroom"

    def test_normalize_none_for_too_short(self):
        """Return None for room names shorter than 3 chars"""
        short_names = ["ab", "a", ""]
        for name in short_names:
            result = normalize_jitsi_room_name(name)
            assert result is None, f"Should return None for: {name}"

    def test_normalize_none_for_too_long(self):
        """Return None for room names longer than 200 chars"""
        long_name = "a" * 201
        result = normalize_jitsi_room_name(long_name)
        assert result is None

    def test_normalize_max_length_valid(self):
        """Accept room names exactly 200 chars"""
        max_name = "a" * 200
        result = normalize_jitsi_room_name(max_name)
        assert result == "a" * 200
        assert len(result) == 200

    def test_normalize_min_length_valid(self):
        """Accept room names exactly 3 chars"""
        min_name = "abc"
        result = normalize_jitsi_room_name(min_name)
        assert result == "abc"

    def test_normalize_none_for_only_special_chars(self):
        """Return None if only special characters (nothing left after cleanup)"""
        special_only = "!@#$%^&*()"
        result = normalize_jitsi_room_name(special_only)
        assert result is None

    def test_normalize_none_for_url_without_room(self):
        """Return None for URL without room name in path"""
        url = "https://8x8.vc/"
        result = normalize_jitsi_room_name(url)
        assert result is None

    def test_normalize_none_from_empty_input(self):
        """Handle None and empty string gracefully"""
        assert normalize_jitsi_room_name(None) is None
        assert normalize_jitsi_room_name("") is None
        assert normalize_jitsi_room_name("   ") is None


class TestOtherStreamUrlValidation:
    """Test OTHER platform URL validation"""

    def test_validate_https_url(self):
        """Accept valid HTTPS URLs"""
        url = "https://teams.microsoft.com/l/meetup-join/123"
        result = validate_other_stream_url(url)
        assert result == url

    def test_validate_simple_https_url(self):
        """Accept simple HTTPS URL"""
        url = "https://example.com/stream"
        result = validate_other_stream_url(url)
        assert result == url

    def test_validate_url_with_long_path(self):
        """Accept URL with complex path"""
        url = "https://example.com/path/to/stream/session/123"
        result = validate_other_stream_url(url)
        assert result == url

    def test_validate_url_with_query_params(self):
        """Accept URL with query parameters"""
        url = "https://example.com/stream?id=123&token=abc"
        result = validate_other_stream_url(url)
        assert result == url

    def test_validate_url_with_fragment(self):
        """Accept URL with fragment identifier"""
        url = "https://example.com/stream#section"
        result = validate_other_stream_url(url)
        assert result == url

    def test_validate_url_with_subdomain(self):
        """Accept URL with subdomains"""
        url = "https://live.streaming.example.com/event"
        result = validate_other_stream_url(url)
        assert result == url

    def test_validate_url_with_port(self):
        """Accept URL with port number"""
        url = "https://example.com:8443/stream"
        result = validate_other_stream_url(url)
        assert result == url

    def test_validate_url_with_hyphens(self):
        """Accept URL with hyphens in domain"""
        url = "https://my-streaming-site.com/event"
        result = validate_other_stream_url(url)
        assert result == url

    def test_validate_url_with_numbers(self):
        """Accept URL with numbers in domain"""
        url = "https://stream123.example.com/live"
        result = validate_other_stream_url(url)
        assert result == url

    def test_validate_url_with_whitespace(self):
        """Handle URLs with leading/trailing whitespace"""
        url = "  https://example.com/stream  "
        result = validate_other_stream_url(url)
        assert result == "https://example.com/stream"

    def test_validate_none_for_http_url(self):
        """Reject HTTP URLs (only HTTPS allowed)"""
        url = "http://example.com/stream"
        result = validate_other_stream_url(url)
        assert result is None

    def test_validate_none_for_non_url(self):
        """Reject non-URL strings"""
        invalid_urls = [
            "not-a-url",
            "example.com",
            "www.example.com",
            "ftp://example.com",
        ]
        for url in invalid_urls:
            result = validate_other_stream_url(url)
            assert result is None, f"Should return None for: {url}"

    def test_validate_none_for_invalid_domain(self):
        """Reject URLs with invalid domain format"""
        invalid_urls = [
            "https://",
            "https://.",
            "https://.com",
            "https://example",  # No TLD
            "https://-example.com",  # Starts with hyphen
            "https://example-.com",  # Ends with hyphen
        ]
        for url in invalid_urls:
            result = validate_other_stream_url(url)
            assert result is None, f"Should return None for: {url}"

    def test_validate_none_for_too_long(self):
        """Reject URLs longer than 2000 characters"""
        long_url = "https://example.com/" + "a" * 2000
        result = validate_other_stream_url(long_url)
        assert result is None

    def test_validate_max_length_valid(self):
        """Accept URL exactly 2000 characters"""
        # Build URL that's exactly 2000 chars
        base = "https://example.com/"
        padding = "a" * (2000 - len(base))
        max_url = base + padding
        result = validate_other_stream_url(max_url)
        assert result == max_url
        assert len(result) == 2000

    def test_validate_none_from_empty_input(self):
        """Handle None and empty string gracefully"""
        assert validate_other_stream_url(None) is None
        assert validate_other_stream_url("") is None
        assert validate_other_stream_url("   ") is None


class TestEdgeCases:
    """Test edge cases and special scenarios"""

    def test_jitsi_url_case_insensitive(self):
        """Jitsi URLs are case-insensitive (normalized to lowercase)"""
        url = "https://meet.jit.si/MyEventROOM"
        result = normalize_jitsi_room_name(url)
        assert result == "myeventroom"

    def test_jitsi_mixed_formatting(self):
        """Handle mixed spaces, underscores, and special chars"""
        room_name = "My_Event  Room--2024!"
        result = normalize_jitsi_room_name(room_name)
        assert result == "my-event-room-2024"

    def test_jitsi_unicode_chars(self):
        """Remove unicode characters"""
        room_name = "Café-Room-2024"
        result = normalize_jitsi_room_name(room_name)
        assert result == "caf-room-2024"

    def test_other_real_world_urls(self):
        """Test with real-world streaming platform URLs"""
        real_urls = [
            "https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc",
            "https://whereby.com/my-room",
            "https://daily.co/event-room",
            "https://streamyard.com/watch/abc123",
        ]
        for url in real_urls:
            result = validate_other_stream_url(url)
            assert result == url, f"Should accept: {url}"

    def test_other_url_with_encoded_chars(self):
        """Accept URLs with percent-encoded characters"""
        url = "https://example.com/room%20name"
        result = validate_other_stream_url(url)
        assert result == url

    def test_jitsi_room_from_complex_path(self):
        """Extract room name from complex JaaS path"""
        url = "https://8x8.vc/vpaas-magic-cookie-1234567890abcdef/MyComplexRoom123"
        result = normalize_jitsi_room_name(url)
        assert result == "mycomplexroom123"

    def test_jitsi_preserves_valid_dashes(self):
        """Preserve dashes in already well-formatted names"""
        room_name = "tech-summit-2024"
        result = normalize_jitsi_room_name(room_name)
        assert result == "tech-summit-2024"

    def test_other_url_with_authentication(self):
        """Accept URL with authentication token in query"""
        url = "https://stream.example.com/live?auth=bearer_token_123&session=xyz"
        result = validate_other_stream_url(url)
        assert result == url

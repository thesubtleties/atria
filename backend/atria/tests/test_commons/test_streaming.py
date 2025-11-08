"""
Tests for streaming utilities (api/commons/streaming.py).

Tests URL/ID extraction and normalization for multi-platform streaming support.
Used by schemas to normalize user input before saving to database.
"""
import pytest
from api.commons.streaming import extract_vimeo_id, extract_mux_playback_id, normalize_zoom_url


class TestVimeoExtraction:
    """Test Vimeo URL/ID extraction and normalization"""

    def test_extract_from_standard_url(self):
        """Extract video ID from standard Vimeo URL"""
        url = "https://vimeo.com/123456789"
        result = extract_vimeo_id(url)
        assert result == "123456789"

    def test_extract_from_player_url(self):
        """Extract video ID from Vimeo player embed URL"""
        url = "https://player.vimeo.com/video/987654321"
        result = extract_vimeo_id(url)
        assert result == "987654321"

    def test_extract_from_raw_id(self):
        """Accept raw numeric video ID (already normalized)"""
        raw_id = "555666777"
        result = extract_vimeo_id(raw_id)
        assert result == "555666777"

    def test_extract_from_url_with_query_params(self):
        """Extract ID from URL with query parameters"""
        url = "https://vimeo.com/123456789?autoplay=1&loop=1"
        result = extract_vimeo_id(url)
        assert result == "123456789"

    def test_extract_from_url_with_whitespace(self):
        """Handle URLs with leading/trailing whitespace"""
        url = "  https://vimeo.com/123456789  "
        result = extract_vimeo_id(url)
        assert result == "123456789"

    def test_extract_none_from_invalid_url(self):
        """Return None for invalid Vimeo URLs"""
        invalid_urls = [
            "https://youtube.com/watch?v=abc",
            "not-a-url",
            "https://vimeo.com/",  # No ID
            "https://vimeo.com/invalid-id",  # Non-numeric
        ]
        for url in invalid_urls:
            result = extract_vimeo_id(url)
            assert result is None, f"Should return None for: {url}"

    def test_extract_none_from_empty_input(self):
        """Handle None and empty string gracefully"""
        assert extract_vimeo_id(None) is None
        assert extract_vimeo_id("") is None
        assert extract_vimeo_id("   ") is None


class TestMuxExtraction:
    """Test Mux Playback ID extraction and normalization"""

    def test_extract_from_stream_url(self):
        """Extract Playback ID from standard Mux stream URL"""
        url = "https://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe.m3u8"
        result = extract_mux_playback_id(url)
        assert result == "DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"

    def test_extract_from_stream_url_without_extension(self):
        """Extract Playback ID from URL without .m3u8 extension"""
        url = "https://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"
        result = extract_mux_playback_id(url)
        assert result == "DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"

    def test_extract_from_raw_playback_id(self):
        """Accept raw Playback ID (already normalized)"""
        playback_id = "DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"
        result = extract_mux_playback_id(playback_id)
        assert result == "DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"

    def test_extract_short_playback_id(self):
        """Handle shorter Playback IDs (min 10 chars)"""
        short_id = "ABC123XYZ9"
        result = extract_mux_playback_id(short_id)
        assert result == "ABC123XYZ9"

    def test_extract_very_long_playback_id(self):
        """Handle very long Playback IDs (up to 100 chars)"""
        long_id = "A" * 50 + "1" * 50  # 100 chars total
        result = extract_mux_playback_id(long_id)
        assert result == long_id

    def test_extract_from_url_with_whitespace(self):
        """Handle URLs with leading/trailing whitespace"""
        url = "  https://stream.mux.com/DS00Spx1CV902.m3u8  "
        result = extract_mux_playback_id(url)
        assert result == "DS00Spx1CV902"

    def test_extract_none_from_invalid_input(self):
        """Return None for invalid Mux inputs"""
        invalid_inputs = [
            "https://vimeo.com/123456789",  # Wrong platform
            "not-a-playback-id!@#",  # Special characters
            "tooshort",  # Less than 10 chars
            "A" * 101,  # More than 100 chars
        ]
        for input_val in invalid_inputs:
            result = extract_mux_playback_id(input_val)
            assert result is None, f"Should return None for: {input_val}"

    def test_extract_none_from_empty_input(self):
        """Handle None and empty string gracefully"""
        assert extract_mux_playback_id(None) is None
        assert extract_mux_playback_id("") is None
        assert extract_mux_playback_id("   ") is None


class TestZoomNormalization:
    """Test Zoom meeting URL/ID normalization"""

    def test_normalize_from_standard_url(self):
        """Keep standard Zoom join URL as-is"""
        url = "https://zoom.us/j/1234567890"
        result = normalize_zoom_url(url)
        assert result == "https://zoom.us/j/1234567890"

    def test_normalize_from_url_with_password(self):
        """Keep URL with password parameter as-is"""
        url = "https://zoom.us/j/1234567890?pwd=abc123xyz"
        result = normalize_zoom_url(url)
        assert result == "https://zoom.us/j/1234567890?pwd=abc123xyz"

    def test_normalize_from_raw_meeting_id(self):
        """Convert raw meeting ID to full URL"""
        meeting_id = "1234567890"
        result = normalize_zoom_url(meeting_id)
        assert result == "https://zoom.us/j/1234567890"

    def test_normalize_from_meeting_id_with_spaces(self):
        """Convert meeting ID with spaces to URL"""
        meeting_id = "123 456 7890"
        result = normalize_zoom_url(meeting_id)
        assert result == "https://zoom.us/j/1234567890"

    def test_normalize_from_meeting_id_with_dashes(self):
        """Convert meeting ID with dashes to URL"""
        meeting_id = "123-456-7890"
        result = normalize_zoom_url(meeting_id)
        assert result == "https://zoom.us/j/1234567890"

    def test_normalize_from_11_digit_id(self):
        """Handle 11-digit meeting IDs"""
        meeting_id = "12345678901"
        result = normalize_zoom_url(meeting_id)
        assert result == "https://zoom.us/j/12345678901"

    def test_normalize_from_9_digit_id(self):
        """Handle 9-digit meeting IDs (minimum length)"""
        meeting_id = "123456789"
        result = normalize_zoom_url(meeting_id)
        assert result == "https://zoom.us/j/123456789"

    def test_normalize_from_url_with_whitespace(self):
        """Handle URLs with leading/trailing whitespace"""
        url = "  https://zoom.us/j/1234567890  "
        result = normalize_zoom_url(url)
        assert result == "https://zoom.us/j/1234567890"

    def test_normalize_from_zoom_com_domain(self):
        """Accept zoom.com domain (alternative)"""
        url = "https://zoom.com/j/1234567890"
        result = normalize_zoom_url(url)
        assert result == "https://zoom.com/j/1234567890"

    def test_normalize_none_from_invalid_url(self):
        """Return None for non-Zoom URLs"""
        invalid_urls = [
            "https://vimeo.com/123456789",
            "https://google.com/",
            "not-a-url",
        ]
        for url in invalid_urls:
            result = normalize_zoom_url(url)
            assert result is None, f"Should return None for: {url}"

    def test_normalize_none_from_invalid_meeting_id(self):
        """Return None for invalid meeting ID formats"""
        invalid_ids = [
            "12345678",  # Too short (8 digits)
            "123456789012",  # Too long (12 digits)
            "abcdefghij",  # Non-numeric
            "",  # Empty
        ]
        for meeting_id in invalid_ids:
            result = normalize_zoom_url(meeting_id)
            assert result is None, f"Should return None for: {meeting_id}"

    def test_normalize_none_from_empty_input(self):
        """Handle None and empty string gracefully"""
        assert normalize_zoom_url(None) is None
        assert normalize_zoom_url("") is None
        assert normalize_zoom_url("   ") is None


class TestEdgeCases:
    """Test edge cases and special scenarios"""

    def test_vimeo_with_http_not_https(self):
        """Handle HTTP URLs (not just HTTPS)"""
        url = "http://vimeo.com/123456789"
        result = extract_vimeo_id(url)
        assert result == "123456789"

    def test_mux_generic_url_pattern(self):
        """Extract from generic mux.com URL (fallback pattern)"""
        url = "https://image.mux.com/DS00Spx1CV902/thumbnail.jpg"
        result = extract_mux_playback_id(url)
        assert result == "DS00Spx1CV902"

    def test_zoom_mixed_spaces_and_dashes(self):
        """Handle meeting IDs with mixed formatting"""
        meeting_id = "123-456 789 0"
        result = normalize_zoom_url(meeting_id)
        assert result == "https://zoom.us/j/1234567890"

    def test_vimeo_url_with_path_segments(self):
        """Extract ID even with additional path segments"""
        url = "https://vimeo.com/123456789/extra/path"
        result = extract_vimeo_id(url)
        assert result == "123456789"

    def test_case_sensitivity(self):
        """Playback IDs are case-sensitive - preserve case"""
        playback_id = "AbC123XyZ0"  # 10 chars (meets minimum)
        result = extract_mux_playback_id(playback_id)
        assert result == "AbC123XyZ0"  # Exact case preserved

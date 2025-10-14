"""
Preset avatar configurations for new user accounts.
"""
import os

# Avatar API base URL - uses environment variable for production
AVATAR_API_BASE = os.getenv(
    "AVATAR_API_URL",
    "https://api.dicebear.com/7.x/avataaars/svg"
)

# Preset avatar configurations
AVATAR_PRESETS = [
    # Short hair, hoodie, smile
    {
        "top": "shortFlat",
        "hairColor": "4a312c",  # Dark brown
        "skinColor": "ae5d29",
        "eyes": "happy",
        "eyebrows": "defaultNatural",
        "mouth": "smile",
        "clothing": "hoodie",
        "clothesColor": "3c4f5c",  # Dark blue
    },
    # Shaggy hair, casual shirt, wink
    {
        "top": "shaggy",
        "hairColor": "2c1b18",  # Black
        "skinColor": "fd9841",
        "eyes": "wink",
        "eyebrows": "raisedExcitedNatural",
        "mouth": "twinkle",
        "clothing": "shirtCrewNeck",
        "clothesColor": "5199e4",  # Blue
        "facialHair": "beardLight",
        "facialHairColor": "2c1b18",
        "facialHairProbability": "100",
    },
    # Caesar cut, blazer, professional
    {
        "top": "theCaesar",
        "hairColor": "b58143",  # Blonde
        "skinColor": "ffdbb4",
        "eyes": "default",
        "eyebrows": "flatNatural",
        "mouth": "serious",
        "clothing": "blazerAndShirt",
        "clothesColor": "262e33",  # Black
    },
    # Bob cut, hearts eyes, pink shirt
    {
        "top": "bob",
        "hairColor": "724133",  # Brown
        "skinColor": "d08b5b",
        "eyes": "hearts",
        "eyebrows": "raisedExcitedNatural",
        "mouth": "smile",
        "clothing": "shirtScoopNeck",
        "clothesColor": "ff488e",  # Pink
    },
    # Curly hair, blue overalls, wink
    {
        "top": "curly",
        "hairColor": "2c1b18",  # Black
        "skinColor": "614335",
        "eyes": "wink",
        "eyebrows": "defaultNatural",
        "mouth": "twinkle",
        "clothing": "overall",
        "clothesColor": "5199e4",  # Blue
    },
    # Long straight hair, gray blazer, smile
    {
        "top": "straight01",
        "hairColor": "a55728",  # Auburn
        "skinColor": "edb98a",
        "eyes": "happy",
        "eyebrows": "defaultNatural",
        "mouth": "smile",
        "clothing": "blazerAndSweater",
        "clothesColor": "929598",  # Gray
    },
]


def get_random_avatar_url():
    """
    Generate a URL for a random preset avatar configuration.
    Returns a complete avatar URL with all customization parameters.
    """
    import random

    preset = random.choice(AVATAR_PRESETS)

    # Build URL parameters
    params = []
    for key, value in preset.items():
        params.append(f"{key}={value}")

    query_string = "&".join(params)
    return f"{AVATAR_API_BASE}?{query_string}"

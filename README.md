# Atria - Event Management & Networking Platform

Atria is a comprehensive event management platform that enables organizers to create and manage events, sessions, and facilitate networking among attendees. The platform offers real-time communication features, detailed session management, and robust user administration capabilities. This is a work in progress, and a roadmap can be found at the bottom of this readme.

## 🚀 Features

### Event Management

- Create and manage events with detailed information
- Session scheduling and management
- Speaker assignment and management

### Networking

- Real-time chat rooms for event attendees
- Direct messaging between attendees
- Connection management for attendees

### Administration

- User management with role-based permissions
- Invitation system for event attendees
- Batch user operations (CSV import, mass updates)

### Organization

- Organization management
- Multi-organization support
- Organization-specific event management

## 🛠️ Technology Stack

### Backend

- Python with Flask framework
- Flask-Smorest for API documentation
- Flask-SocketIO for real-time communication
- SQLAlchemy ORM
- JWT Authentication

### Frontend

- React.js
- Redux Toolkit for state management
- RTK Query for API integration
- Mantine UI component library
- Socket.IO client for real-time features

## 🏗️ Architecture


### Backend

- Routes: API endpoints by resource
- Schemas: Data validation and serialization
- Services: Business logic layer
- Models: Database entities
- Sockets: Real-time communication handlers

### Frontend

- Features-based organization
- Component-driven UI
- Redux for global state management
- RTK Query for API data fetching and caching

## 🔧 Development Setup

### Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL (recommended for production)
- Redis (planned for future Socket.IO scaling - not yet implemented)

### Setup with Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd atria

# Create .env file from example
cp .env.example .env
# Edit .env file with your configurations

# Start the application with Docker
docker-compose up -d

# The application will be available at:
# - Backend: http://localhost:5000
# - Frontend: http://localhost:5173
```

### Manual Setup (Alternative)

#### Backend Setup

```bash
# Navigate to backend directory
cd backend/atria

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -e .

# Set up environment variables
cp .env.example .env
# Edit .env file with your configurations

# Initialize the database
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# Seed the database (optional)
python -m seeders.seed_db

# Run the development server
flask run
```

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:5000/api" > .env.local

# Run the development server
npm run dev
```

## 📋 API Documentation

API documentation is available at `/new-swagger` when the backend server is running (http://localhost:5000/new-swagger).

## 🌟 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 Dual License

This project is available under a dual license:

### Personal and Educational Use License

For personal and educational purposes, this software is available for free use, modification, and distribution under the terms of the MIT License.

### Commercial Use License

For commercial use, including but not limited to:

- Use within a for-profit business or organization
- Integration into commercial products or services
- Monetization of the software or derivatives
- Providing services based on this software to paying customers

A separate commercial license is required. Please contact the copyright holder for commercial licensing information.

**All rights reserved for commercial use.** Unauthorized commercial use, distribution, or modification is prohibited.

# Atria Development Roadmap

## Phase 1: Networking Integration (Current Priority)

# Atria Development Roadmap

## Phase 1: Networking Integration (In Progress)
Building core networking and communication features

### Chat (In Progress)
Public chat functionality for events

- [x] Backend
- [x] Networking area chat rooms
- [ ] Individual session chat room
- [ ] Moderation/muting capabilities
- [ ] Public chat notifications

### Direct Messaging (In Progress)
Private messaging between users

- [x] Direct message functionality
- [x] List of conversations
- [x] Base frontend UI
- [x] Proper filtering
- [ ] End-to-end encryption
- [ ] Ice breaker connection starter
- [ ] Block/remove connection options
- [ ] Emoji support
- [ ] Admin connection options

### Connection Management (Planned)
Manage connections with other attendees

- [ ] Attendee directory
- [ ] Attendee cards/base profiles

## Phase 2: Personal Pages (Planned)
User profiles and personal networking features

### Profile Management (Planned)
User profile creation and management

- [ ] Create/update profile page
- [ ] Profile image upload/emoji generator
- [ ] Cards for connections

### Connection Features (Planned)
Connection management capabilities

- [ ] Ability to start connections
- [ ] Create DM from connection page
- [ ] Favorite specific connections
- [ ] Accept/decline connection requests
- [ ] Speaker connection preferences

## Phase 3: Attendee Management (Planned)
Tools for managing event attendees

### Invitation System (Planned)
Attendee invitation functionality

- [ ] Invite attendee via email
- [ ] Invitation status tracking
- [ ] Existing account handling
- [ ] CSV/mass invite options

### Attendee Controls (Planned)
Attendee management features

- [ ] Ability for attendees to leave event
- [ ] Event archiving
- [ ] Role assignment upon invitation

## Phase 4: Sessions/Session Management (Planned)
Enhanced session organization and features

### Session Content (Planned)
Session content and details

- [ ] Cleaner session page with details
- [ ] Speakers area with social links
- [ ] Speaker ordering capability

### Session Features (Planned)
Interactive session capabilities

- [ ] Per-session chat option
- [ ] Session tracking
- [ ] Event timer for video preparation

### Updated Streaming Integration (Planned)
Video streaming capabilities

- [ ] Basic streaming integration
- [ ] Vimeo, DaCast and other embeds

## Phase 5: Admin Features (Planned)
Administrative tools for event management

### Chat Administration (Planned)
Chat room management tools

- [ ] Add/change chat rooms
- [ ] Set time on chat room open/close

### Event Settings (Planned)
Event configuration options

- [ ] Theme options
- [ ] Highlight and front page customization
- [ ] Comprehensive event settings page

## Phase 6: Sponsors (Planned)
Sponsor management and integration

### Sponsor Management (Planned)
Core sponsor functionality

- [x] Sponsors page
- [ ] Per-session sponsorship area
- [x] Sponsor levels with custom names
- [ ] Sponsor level descriptions

### Sponsor Integration (Planned)
Sponsor visibility features

- [ ] Sponsor imagery management
- [ ] Sponsored chat rooms with timed opening
- [ ] Chat page sponsorship options
- [ ] Topical sponsorship for chat rooms

## Phase 7: Long-term Features (Planned)
Advanced features for future development

### Direct Messaging Enhancements (Planned)
Advanced messaging capabilities

- [ ] Event-specific chatbot with RAG
- [ ] WebRTC video calls with connections

### Ticketing (Planned)
Comprehensive ticketing system

- [ ] Paid ticketing options
- [ ] Public and private event settings
- [ ] Upcoming events page
- [ ] Placement promotion for events
- [ ] Privacy-preserving analytics

### Session Enhancements (Planned)
Advanced session features

- [ ] Q&A functionality
- [ ] Live polling integration
- [ ] Hybrid event support
- [ ] Zoom embed support

### Sponsor Enhancements (Planned)
Advanced sponsor capabilities

- [ ] Direct ticket purchasing for attendees
- [ ] Cross-event invitation capabilities

### Promotional Features (Planned)
Marketing and promotional tools

- [ ] White-label streaming platform
- [ ] Food delivery partnerships
- [ ] Event hosting fee model
- [ ] Broadcasting partnerships

### Platform Expansion (Planned)
Expanding platform availability

- [ ] Progressive web app
- [ ] Electron app
- [ ] Mobile application
- [ ] LLM integration for content

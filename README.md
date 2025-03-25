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

The application follows a clean architecture with clear separation of concerns:

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
- Redis (for Socket.IO)

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

### Real-time Communication

- [ ] Implement chat room UI components
  - [ ] Chat message display
  - [ ] Message input with emoji support
  - [ ] Chat member list sidebar
- [ ] Connect Socket.IO events to frontend
  - [ ] Chat room subscription
  - [ ] Real-time message updates
  - [ ] Online status indicators
- [ ] Direct messaging interface
  - [ ] Conversation list
  - [ ] Message thread view
  - [ ] New conversation creation

### Connection Management

- [ ] User discovery interface
  - [ ] Searchable attendee directory
  - [ ] Filter by interests/role
  - [ ] Attendee profile cards
- [ ] Connection request flow
  - [ ] Send/receive connection requests
  - [ ] Accept/decline functionality
  - [ ] Connection management page

## Phase 2: Session Management Enhancement

### Session UI Improvements

- [ ] Detailed session view page
  - [ ] Session description
  - [ ] Date/time with timezone support
  - [ ] Speaker information
- [ ] Session editing modal improvements
  - [ ] Speaker assignment interface
  - [ ] Speaker selection from event attendees
  - [ ] Multiple speaker support

### Speaker Management

- [ ] Speaker profiles
  - [ ] Bio and photo
  - [ ] Speaking history
  - [ ] Contact information (private to organizers)
- [ ] Speaker assignment interface
  - [ ] Link existing users as speakers
  - [ ] Invite external speakers

## Phase 2.5: Streaming Integration

### Video Streaming Services

- [ ] Multiple streaming provider integration
  - [ ] Zoom meeting/webinar embed support (Otherwise will have open in Zoom app - TBD)
  - [ ] Dacast integration
  - [ ] Alternative embed solutions
- [ ] Session-streaming association
  - [ ] Automatically update session to "live" ~5 minutes before start time
- [ ] Live vs. Recorded content handling
  - [ ] Live indicator for active streams
  - [ ] Playback controls for recorded content
  - [ ] Transition from live to recorded - Vimeo should handle automatically, but allow option to change embed link out.

## Phase 3: Admin Functionality

### User Management

- [ ] Admin dashboard for user management
  - [ ] User listing with filtering and search
  - [ ] Role management
  - [ ] Status indicators
- [ ] Invitation system
  - [ ] Email invitation interface
  - [ ] Batch invitation via CSV upload
  - [ ] Invitation tracking

### Role Management

- [ ] Role assignment interface
  - [ ] Predefined roles (Admin, Organizer, Speaker, Attendee)
  - [ ] Role permissions configuration
  - [ ] Custom role creation

### Networking Control

- [ ] Networking permissions integrated in user management
  - [ ] Toggle networking access per user
  - [ ] Batch enable/disable networking
  - [ ] Networking access levels (all, groups, none)

## Phase 4: Event Configuration

### Event Settings

- [ ] Event settings page
  - [ ] Basic information (name, dates, description)
  - [ ] Branding options (logo, colors)
  - [ ] Privacy settings
- [ ] Event customization
  - [ ] Custom fields for registration
  - [ ] Agenda display options
  - [ ] Feature toggles (networking, chat, etc.)

### Agenda Management

- [ ] Drag-and-drop agenda builder
  - [ ] Time slot management
  - [ ] Track organization
  - [ ] Session assignment to slots

## Phase 5: Sponsor Management

### Sponsor Features

- [ ] Backend models and APIs for sponsors
  - [ ] Sponsor data model
  - [ ] CRUD operations
  - [ ] Sponsor levels/tiers
- [ ] Sponsor management interface
  - [ ] Sponsor listing
  - [ ] Logo and profile management
  - [ ] Sponsorship level assignment

### Sponsor Integration

- [ ] Sponsor display page
  - [ ] Tiered sponsor showcase
  - [ ] Sponsor profiles
  - [ ] Contact information
- [ ] Sponsor chat rooms
  - [ ] Branded chat spaces
  - [ ] Representatives assignment
  - [ ] Attendee access control

## Phase 6: Analytics and Reporting

### Event Analytics

- [ ] Attendance tracking
  - [ ] Session attendance metrics
  - [ ] User engagement statistics
  - [ ] Real-time participation monitoring
- [ ] Networking analytics
  - [ ] Connection statistics
  - [ ] Message activity metrics
  - [ ] Most active users/sessions

### Reporting

- [ ] Customizable reports
  - [ ] Attendance reports
  - [ ] Session popularity
  - [ ] User feedback aggregation
- [ ] Export functionality
  - [ ] CSV/Excel export
  - [ ] PDF report generation
  - [ ] Scheduled report delivery

## Phase 7: Platform Refinement

### Performance Optimization

- [ ] Backend optimization
  - [ ] Query optimization
  - [ ] Caching implementation
  - [ ] API response time improvements
- [ ] Frontend optimization
  - [ ] Bundle size reduction
  - [ ] Lazy loading implementation
  - [ ] Component memoization

### UI/UX Improvements

- [ ] Design system refinement
  - [ ] Consistent component styling
  - [ ] Accessibility improvements
  - [ ] Mobile responsiveness
- [ ] User flow optimization
  - [ ] Onboarding experience
  - [ ] Navigation simplification
  - [ ] Contextual help

### Testing and Stability

- [ ] Comprehensive test coverage
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] End-to-end tests
- [ ] Error handling improvements
  - [ ] User-friendly error messages
  - [ ] Recovery flows
  - [ ] Logging and monitoring

## Future Considerations

- Mobile app development
- Presenter backend that takes in Vmix Call embed + internet clicker embed + enables polling (either built in or 3rd party) for high end fully produced events.
- Calendar/scheduling integration
- Payment processing for ticketing
- Multi-language support
- Advanced content management
- Exhibitor management
- Streaming CDN partnerships for preferred pricing/features
- White-label streaming solution integrations
- Custom player with branding options


# Atria - Event Management & Networking Platform

Atria is a comprehensive event management platform that enables organizers to create and manage events, sessions, and facilitate networking among attendees. The platform offers real-time communication features, detailed session management, and robust user administration capabilities. This is a work in progress, and a roadmap can be found at the bottom of this readme.

## 🚀 Features

### Security & Authentication

- HttpOnly cookie authentication for enhanced security
- JWT tokens with automatic refresh
- Role-based access control (RBAC)
- Hybrid auth approach: cookies for HTTP, tokens for WebSocket

### Event Management

- Create and manage events with detailed information
- Session scheduling with drag-and-drop speaker ordering
- Session chat rooms (PUBLIC and BACKSTAGE)
- Session type badges and visual organization

### Networking

- Real-time chat rooms with tabbed interface
- Direct messaging between attendees
- Attendee profiles with privacy controls
- Connection management system (in development)

### Administration

- User management with role-based permissions
- SessionManager for bulk editing
- Inline editing with auto-save
- Time conflict detection
- Batch user operations (CSV import, mass updates)

### Organization

- Organization management
- Multi-organization support
- Organization-specific event management

### Sponsors

- Multi-tier sponsor system
- Logo upload with image optimization (80-90% size reduction)
- Drag-and-drop reordering
- Social links and contact information

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

## 📄 License

Copyright © 2025 SBTL LLC

Atria is dual-licensed:

### Open Source License (AGPL-3.0)

Atria is licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0). This means:
- You can use, modify, and distribute the software
- Any modifications or derivative works must also be licensed under AGPL-3.0
- If you run a modified version on a server, you must provide the source code to users

### Commercial License

For organizations that cannot comply with the AGPL-3.0 license, commercial licenses are available. Commercial licensing allows:
- Private modifications without source code disclosure
- Integration into proprietary systems
- Custom support and SLA options

For commercial licensing inquiries, please contact: steven@sbtl.dev

### Contributing

We welcome contributions! However, all contributors must sign our [Contributor License Agreement](CLA.md) before we can accept your pull request. This allows us to maintain the dual-licensing model while accepting community contributions.

Please see our [Contributing Guidelines](CONTRIBUTING.md) for more information.

### Attribution Requirement

In accordance with Section 7(b) of the AGPL-3.0 license, you are required to retain the attribution in the event navigation sidebar. The attribution must display:

**"atria is made with ❤️ by sbtl"**

Where:
- "atria" links to https://atria.gg
- "sbtl" links to https://sbtl.dev

This attribution must remain visible and unmodified in the event navigation sidebar. See [LICENSE-ATTRIBUTION.md](LICENSE-ATTRIBUTION.md) for complete details.

For commercial licenses without attribution requirements, please contact steven@sbtl.dev.

# Atria Development Roadmap

## Phase 1: Networking Integration (Current Priority)

# Atria Development Roadmap

## Phase 1: Networking Integration (In Progress)
Building core networking and communication features

### Chat (Mostly Complete)
Public chat functionality for events

- [x] Backend implementation
- [x] Networking area chat rooms with tabbed interface
- [x] Individual session chat rooms (PUBLIC and BACKSTAGE)
- [x] Real-time messaging with Socket.IO
- [x] Frontend chat UI with MessageList and MessageInput components
- [ ] Moderation/muting capabilities
- [ ] Public chat notifications
- [ ] Typing indicators

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

### Connection Management (In Progress)
Manage connections with other attendees

- [x] Attendee directory with role-based filtering
- [x] Attendee cards/base profiles (PersonCard component)
- [x] Privacy controls for attendee visibility
- [ ] Connection request functionality (placeholder exists)
- [ ] Accept/decline connection flows

## Phase 2: Personal Pages (Planned)
User profiles and personal networking features

### Profile Management (Mostly Complete)
User profile creation and management

- [x] Create/update profile page with view/edit modes
- [x] Professional info (company, title, bio)
- [x] Social links integration
- [x] Profile image upload with MinIO storage
- [ ] Emoji generator alternative
- [ ] Cards for connections

### Connection Features (Planned)
Connection management capabilities

- [ ] Ability to start connections
- [ ] Create DM from connection page
- [ ] Favorite specific connections
- [ ] Accept/decline connection requests
- [ ] Speaker connection preferences

## Phase 3: Attendee Management (In Progress)
Tools for managing event attendees

### Invitation System (Partially Complete)
Attendee invitation functionality

- [x] Invite attendee via email
- [x] Invitation status tracking
- [x] Existing account handling
- [x] Resend invitations
- [x] Cancel pending invitations
- [ ] CSV/mass invite options

### Attendee Controls (Mostly Complete)
Attendee management features

- [x] Role management (Admin, Organizer, Speaker, Attendee)
- [x] Search and filter attendees
- [x] View attendee details and join dates
- [x] Pagination for large attendee lists
- [ ] Ability for attendees to leave event
- [ ] Event archiving

## Phase 4: Sessions/Session Management (Planned)
Enhanced session organization and features

### Session Content (Complete)
Session content and details

- [x] Cleaner session page with streamlined UI
- [x] Speakers area with social links
- [x] Speaker ordering capability with drag-and-drop
- [x] Session type badges (color-coded)
- [x] Collapsible chat sidebar
- [ ] Short description for agenda view

### Session Features (Partially Complete)
Interactive session capabilities

- [x] Per-session chat rooms (PUBLIC and BACKSTAGE types)
- [x] Auto-created chat rooms for new sessions
- [x] SessionChatMode for granular control
- [ ] Session tracking/attendance
- [ ] Event timer for video preparation

### Updated Streaming Integration (In Progress)
Video streaming capabilities

- [x] Basic streaming integration framework
- [ ] Vimeo embed support
- [ ] DaCast embed support
- [ ] Other streaming platform embeds

## Phase 5: Admin Features (In Progress)
Administrative tools for event management

### Session Management (Complete)
Advanced session administration tools

- [x] SessionManager component for bulk operations
- [x] Inline editing with auto-save
- [x] Zod validation for form inputs
- [x] Time conflict detection
- [x] Drag-and-drop speaker reordering

### Chat Administration (Planned)
Chat room management tools

- [ ] Add/change chat rooms dynamically
- [ ] Set time on chat room open/close
- [ ] Moderation tools

### Event Settings (Planned)
Event configuration options

- [ ] Theme options
- [ ] Highlight and front page customization
- [ ] Comprehensive event settings page

### Attendee & Speaker Management (Complete)
Admin tools for managing participants

- [x] Attendees Management page with role controls
- [x] Speakers Management page with bio/title overrides
- [x] Session count tracking for speakers
- [x] Invitation system with email integration
- [ ] CSV export functionality
- [ ] Multiple role support (admin who is also speaker)

## Phase 6: Sponsors (Planned)
Sponsor management and integration

### Sponsor Management (Complete)
Core sponsor functionality

- [x] Sponsors page with full CRUD operations
- [x] Sponsor levels with custom names and tiers
- [x] Drag-and-drop reordering with fractional indexing
- [x] Logo upload with WebP optimization (80-90% size reduction)
- [x] Contact info and social links
- [x] Active/featured toggles
- [ ] Per-session sponsorship area
- [ ] Sponsor level descriptions

### Sponsor Integration (Partially Complete)
Sponsor visibility features

- [x] Sponsor imagery management with MinIO storage
- [x] PrivateImage component for secure display
- [x] Image optimization and EXIF orientation fixes
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


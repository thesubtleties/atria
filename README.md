# Atria - Event Management & Professional Networking Platform

**Build meaningful connections that last beyond your events.**

![Version](https://img.shields.io/github/v/release/thesubtleties/atria) [![Live Demo](https://img.shields.io/badge/demo-atria.gg-6366f1)](https://atria.gg) [![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](LICENSE) [![Documentation](https://img.shields.io/badge/docs-docs.atria.gg-34d399)](https://docs.atria.gg)

> ⭐ **If you find Atria interesting, please consider starring this repository** — it helps us grow and reach more people who could benefit from the platform.

<p align="center">
  <img src="https://storage.sbtl.dev/spookyspot/atriaslideshowsmall.webp" alt="Atria Platform Overview" width="100%" />
</p>

---

## What is Atria?

Atria is an **open-source event management platform** that combines comprehensive event administration with intelligent networking features. Unlike bloated enterprise tools or feature-creep SaaS platforms, Atria focuses exclusively on what matters: **your event and the connections made there**.

### Why Atria?

**Event-Focused, Not Platform-Focused**
When you're managing an event, you see only that event. No distracting sidebars, no unrelated organizations, no feature overload. Just powerful tools to run your event and facilitate meaningful networking.

**True Open Source & Data Ownership**
- AGPL-3.0 licensed - complete transparency and freedom
- Your data stays yours - export or migrate anytime, no vendor lock-in
- Self-host or cloud - run it yourself for free, or use managed hosting
- No surprise pricing - never held hostage by sudden price increases
- Community-driven - talk directly to the developers who built it

**Built for Real Events**
- Corporations: Conferences, product launches, training events
- Nonprofits: Fundraising galas, awareness campaigns, volunteer coordination
- Education: Academic conferences, workshops, alumni gatherings
- Faith Organizations: Church conferences, community gatherings, ministry events
- Communities: Professional associations, industry meetups, local events

---

📰 **Stay Updated**: Follow our [blog](https://docs.atria.gg/blog) for release notes, feature announcements, and platform updates.

---

## Quick Start

### Prerequisites

Before you begin, ensure you have:

- **Docker & Docker Compose** (recommended for quickest setup)
- **Node.js 20+** and **Python 3.13+** (if running outside Docker)
- **PostgreSQL 15+** (included in Docker setup)
- **MinIO or S3-compatible storage** (required for file uploads)
  - See [MinIO on GitHub](https://github.com/minio/minio) for self-hosted option
  - Or use AWS S3, DigitalOcean Spaces, or other S3-compatible service
- **Redis** (optional but recommended for caching and real-time features)
  - App works without Redis (graceful degradation) but with reduced features

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/thesubtleties/atria.git
   cd atria
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.development
   ```

   Edit `.env.development` and configure at minimum:
   - Database credentials (already set for Docker)
   - MinIO/S3 credentials (see `.env.example` for details)
   - JWT secret keys (change defaults!)
   - Email settings (optional, for invitations)

3. **Start the platform**

   **Option A: Using the interactive chooser (recommended)**
   ```bash
   ./dev-environment-chooser.sh
   ```
   Select option **1) Standard Local Development** for the simplest setup.

   **Option B: Direct Docker Compose (no tmux required)**
   ```bash
   docker-compose -f docker-compose.local-dev.yml up
   ```

4. **Access your platform**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:5000
   - **API Documentation**: http://localhost:5000/new-swagger

The development environment includes:
- Hot reload for frontend and backend
- PostgreSQL database with sample data
- Automatic dependency installation

**Need more detailed setup instructions?** → [Full installation guide](https://docs.atria.gg/docs/getting-started/installation)

---

## Core Features

**Event Management**
- Multi-day events with complex session scheduling
- Drag-and-drop speaker management with role assignments
- Real-time session status updates
- Hybrid event support (virtual + in-person attendance)
- Session-specific chat rooms (public and backstage)

**Professional Networking**
- Icebreaker system for personalized connection requests
- Attendee discovery by role and interests
- Privacy controls for profile visibility
- Connection management and tracking

**Real-Time Communication**
- Multi-level chat system (general, Q&A, networking, session-specific)
- Direct messaging between attendees
- Administrative and backstage channels
- Live session chat during presentations
- Socket.IO powered instant messaging

**Multi-Tenant Architecture**
- Organization-level management with data isolation
- Role-based access control (Organization: Owner > Admin > Member)
- Event-level permissions (Admin > Organizer > Moderator > Speaker > Attendee)
- Cross-organization event support
- Complete data security and separation

**Sponsor Management**
- Multi-tier system (Platinum, Gold, Silver, Bronze, custom levels)
- Rich sponsor profiles with logos, descriptions, links
- Drag-and-drop reordering for visual organization
- Automatic image optimization (WebP conversion, 80-90% size reduction)

**Security**
- HTTPOnly cookie authentication (XSS protection)
- JWT with automatic refresh tokens
- Granular role-based permissions
- Secure file storage with three-tier access control
- Multi-tenant data isolation

**Developer Experience**
- Comprehensive OpenAPI documentation
- RESTful API design
- Real-time Socket.IO event system
- Hot reload development environment
- Docker-first deployment

---

## Technology Stack

### Backend
- **Python 3.13** with **Flask** framework
- **PostgreSQL 15** with SQLAlchemy ORM
- **Redis 7** for caching, presence tracking, and Socket.IO clustering
- **Flask-SocketIO** for real-time features
- **S3-compatible storage** (MinIO, AWS S3, or similar) for file uploads
- **SMTP2GO** for transactional emails

### Frontend
- **React 18** with **Vite 6** build system
- **Mantine UI 7** component library
- **Redux Toolkit + RTK Query** for state management
- **Socket.IO Client** for real-time updates
- **Zod** for runtime validation

---

## Project Status

**Current State**: Live at atria.gg with active development

- Live deployment at [atria.gg](https://atria.gg)
- 196 passing tests (~47% backend coverage, target: 80%+)
- Automated CI/CD with GitHub Actions
- Multi-instance scaling ready (Socket.IO clustering with Redis)
- Actively maintained with regular updates

**Roadmap highlights**:
- Advanced reporting & analytics
- Interactive polling system
- Ticketing integrations
- AI-enhanced features (session imports, chat host)
- Custom event theming
- Enhanced mobile experience

**Full roadmap & changelog** → [docs.atria.gg/roadmap](https://docs.atria.gg/roadmap)

---

## Documentation & Resources

- **Complete Documentation**: [docs.atria.gg](https://docs.atria.gg)
- **API Reference**: [docs.atria.gg/docs/api/atria-api](https://docs.atria.gg/docs/api/atria-api)
- **Community Support**: [GitHub Discussions](https://github.com/thesubtleties/atria/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/thesubtleties/atria/issues)
- **Commercial Support**: [steven@sbtl.dev](mailto:steven@sbtl.dev)

---

## Contributing

We welcome contributions from the community! Whether fixing bugs, adding features, or improving documentation, your help makes Atria better for everyone.

**Before contributing, please:**
1. Read our [Contributing Guidelines](CONTRIBUTING.md)
2. Sign the [Contributor License Agreement](CLA.md)
3. Check existing [issues](https://github.com/thesubtleties/atria/issues) and [discussions](https://github.com/thesubtleties/atria/discussions)

**Quick contribution guide**:
- Fork the repository and create a feature branch
- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation as needed
- Submit a PR with clear description

All contributions must pass our CI test suite before merging.

---

## Licensing

### Open Source (AGPL-3.0)

Atria is licensed under the [GNU Affero General Public License v3.0](LICENSE).

**You can:**
- Use, modify, and distribute freely
- Run for any purpose including commercial use

**Requirements:**
- Modifications must be licensed under AGPL-3.0
- If you run modified code on a server, you must provide source code to users
- Attribution required: Keep "atria is made with ❤️ by sbtl" in the UI
  - "atria" links to https://atria.gg
  - "sbtl" links to https://sbtl.dev

**Full attribution requirements** → [LICENSE-ATTRIBUTION.md](LICENSE-ATTRIBUTION.md)

### Commercial License

For organizations that cannot comply with AGPL-3.0:
- Private modifications without source disclosure
- Integration into proprietary systems
- Custom support and SLA options
- No attribution requirements

**Contact for commercial licensing**: [steven@sbtl.dev](mailto:steven@sbtl.dev)

---

## Deployment Options

### Self-Hosted (Free)
Run your own instance with complete control. Perfect for organizations with specific compliance requirements or those who prefer full data ownership.

- Free under AGPL-3.0 license
- Complete control over data and infrastructure
- Full source code access for customization
- Community support via GitHub
- **Note**: Self-hosted instances are isolated - users only connect within your events, not across other organizations using Atria
- **Need to self-host but can't comply with AGPL?** Contact us about commercial licensing options: [steven@sbtl.dev](mailto:steven@sbtl.dev)

### Managed Hosting (atria.gg)
Use the hosted SaaS platform with extended networking capabilities and zero infrastructure management.

**Currently in Early Access** - Experience Atria with no event size restrictions while we finalize features and stabilize the platform.

- **Free during Early Access** - no event size limits
- Cross-event networking - users can connect beyond individual events
- Connections are tagged by the event where they originated, keeping your event visible
- Actively maintained with bug fixes and updates
- Multi-tiered data protection (Longhorn + Backblaze B2 backups)
- Broader community reach - attendees can discover familiar faces from other events
- **Note**: Early Access means best-effort uptime while we work toward production-grade infrastructure

**After v1.0 Release**: Free tier for events up to 50 attendees, with paid tiers for larger events and premium features

### Custom Private Instance
Get the benefits of managed hosting with the isolation of self-hosting, plus custom features.

- Managed setup and maintenance without your IT team's involvement
- Private, isolated instance (not part of the shared community)
- Custom branding and feature development
- Flexible commercial licensing (can work around AGPL requirements)
- Custom data retention and reporting capabilities
- Pricing and terms negotiable based on your needs

**Questions about deployment?** → Contact [steven@sbtl.dev](mailto:steven@sbtl.dev)

---

## Support

**Community Support**:
- Documentation: [docs.atria.gg](https://docs.atria.gg)
- GitHub Discussions: [Community forum](https://github.com/thesubtleties/atria/discussions)
- GitHub Issues: [Bug reports & feature requests](https://github.com/thesubtleties/atria/issues)

**Commercial Support**:
- Email: [steven@sbtl.dev](mailto:steven@sbtl.dev)
- Response time: 24-48 hours for general inquiries
- Priority support available for managed hosting customers

---

<div align="center">

**Ready to transform your events?** [Get started now](#quick-start) or [try the live demo](https://atria.gg)

_Building meaningful connections, one event at a time._

Made by [SBTL](https://sbtl.dev) | Copyright © 2025 SBTL LLC

</div>

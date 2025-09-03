# Atria - Professional Event Management & Networking Platform

**Transform your events into powerful networking experiences with real-time engagement and meaningful connections.**

🌐 **[Live Demo](https://atria.gg)** - Experience Atria in action

Atria is a comprehensive event management platform designed for organizations that understand the true value of events lies in the connections made. Whether you're running corporate conferences, nonprofit galas, educational workshops, or community meetups, Atria provides the sophisticated tools needed to create memorable experiences that extend far beyond the event itself.

## Screenshots

<p align="center">
  <img src="https://storage.sbtl.dev/spookyspot/atriaslideshow.webp" alt="Atria Platform Overview" width="100%" />
</p>

## Why Choose Atria?

### **Event-Focused, Not Platform-Focused**

Unlike complex enterprise tools that require months of training, Atria is laser-focused on one thing: **your event**. Once you enter an event, you get a completely event-centric view - no other events distracting you, no cluttered sidebars of unrelated features. No marketing email tools, no CRM bloat, no learning curve. Just powerful event and networking features that work immediately.

### **Open Source & True Data Ownership**

- **No Black Box** - Complete transparency into what happens with your data and how the platform works
- **Real Data Ownership** - Your data stays yours, export or migrate anytime without vendor lock-in
- **Pay What Makes Sense** - Use free self-hosted version or pay for hosted convenience - your choice
- **No Surprise Pricing** - Open source means you're never held hostage by sudden price increases
- **Build What You Need** - Add custom features or modify existing ones to fit your exact requirements
- **Internal Communities** - Create private, internal event networks for your organization's ongoing engagement
- **Built by Event People** - Created by developers with real event management experience, not generic software builders
- **Direct Developer Access** - Talk directly to the people who built it - no call centers, no outsourced support

### For Organizations

- **Minutes to Master** - Intuitive interface that event teams can use immediately without extensive training
- **Your Brand, Your Event** - Attendees experience your event, not another platform's branding
- **Value-Added Virtual** - Enhance in-person events with virtual components rather than replacing them entirely
- **Connection Continuity** - Attendee connections span across multiple events, building lasting professional networks
- **Flexible Hybrid Support** - Virtual when you want it, in-person when you want it, seamlessly integrated

### For Event Organizers

- **Pre-Event Engagement** - Start virtual networking sessions before your live event to build excitement and connections
- **Bridge the Gap** - Live session chat connects virtual and in-person attendees in real-time
- **No Feature Creep** - Focus on events and networking without distracting productivity tools
- **Lasting Impact** - Connections made at one event carry forward, helping attendees find familiar faces at future events
- **Simple Setup** - Event creation and management designed for event professionals, not software engineers

### For Attendees

- **Familiar Faces** - Find connections from previous events and build on existing professional relationships
- **Seamless Participation** - Join virtually for sessions you can't attend in person, or vice versa
- **Purpose-Built Networking** - Connect with context - you met at a specific event for specific professional reasons
- **Pre-Event Connection** - Start building relationships before the event through virtual lead-up sessions
- **Focused Experience** - No social media distractions - just your event and the people who matter for your professional goals

## Perfect For

- **Corporations** - Annual conferences, product launches, training events, and executive retreats
- **Nonprofits** - Fundraising galas, awareness campaigns, volunteer coordination, and donor events
- **Educational Institutions** - Academic conferences, workshops, graduation events, and alumni gatherings
- **Professional Associations** - Industry conferences, certification programs, and member events
- **Community Organizations** - Local meetups, social events, and community building initiatives

## Key Features

### **Advanced Event Management**

- Multi-day event support with complex scheduling
- Session-specific chat rooms (public and backstage)
- Drag-and-drop speaker management with role assignments
- Real-time session status updates and conflict detection
- Hybrid event support for virtual and in-person attendance

### **Intelligent Networking**

- **Event-Context Connections** - Network based on shared interests within specific events
- **Icebreaker System** - Start conversations with personalized connection requests
- **Privacy Controls** - Granular settings for profile visibility and contact preferences
- **Attendee Discovery** - Find and connect with relevant professionals based on roles and interests
- **Connection Management** - Track and manage your professional network growth

### **Real-Time Communication**

- **Multi-Level Chat System** - General, Q&A, networking, and session-specific rooms
- **Direct Messaging** - Private conversations between attendees
- **Administrative Channels** - Backstage and admin-only communication
- **Live Session Chat** - Real-time discussion during presentations
- **Socket.IO Integration** - Instant messaging with reliable delivery

### **Multi-Tenant Architecture**

- **Organization Management** - Support multiple entities with isolated data
- **Role-Based Permissions** - Granular access control at organization and event levels
- **Cross-Organization Events** - Host events with attendees from multiple organizations
- **Flexible User Roles** - From owners and admins to speakers and general attendees

### **Professional Sponsor Management**

- **Multi-Tier System** - Platinum, Gold, Silver, Bronze, and custom sponsor levels
- **Rich Sponsor Profiles** - Logos, descriptions, contact information, and social links
- **Visual Organization** - Drag-and-drop reordering with professional presentation
- **Image Optimization** - Automatic WebP conversion with 80-90% file size reduction

### **Security**

- **HTTPOnly Cookie Authentication** - Enhanced security against XSS attacks
- **JWT with Automatic Refresh** - Seamless session management
- **Role-Based Access Control** - Fine-grained permissions throughout the platform
- **Secure File Storage** - MinIO integration with three-tier security model
- **Data Isolation** - Complete multi-tenant data separation

## Technology Stack

### **Backend**

- **Python 3.13** with **Flask** framework for robust, scalable APIs
- **PostgreSQL** database with SQLAlchemy ORM for reliable data management
- **Flask-SocketIO** for real-time communication features
- Connects with **[MinIO](https://github.com/minio/minio)** object storage for secure, scalable file management
- **SMTP2GO** integration for reliable transactional emails

### **Frontend**

- **React 18** with **Vite** for lightning-fast development and builds
- **Mantine UI** components for professional, accessible interfaces
- **Redux Toolkit** with **RTK Query** for efficient state management
- **Socket.IO Client** for real-time features
- **TypeScript** support for enhanced development experience

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/thesubtleties/atria.git
cd atria

# Copy environment configuration
cp .env.example .env.development
# Edit .env.development with your configuration settings

# Start the complete development stack
docker-compose -f docker-compose.dev-vite.yml up

# Access your platform
# Frontend: http://localhost:5173
# Backend API: http://localhost:5000
# API Docs: http://localhost:5000/new-swagger
```

**Note**: This setup connects to **[MinIO](https://github.com/minio/minio)** for file storage. You can configure your own S3-compatible storage provider in the environment settings.

The development environment includes:

- **Hot reload** for both frontend and backend development
- **PostgreSQL database** with health checks
- **Volume mounting** for live code updates
- **Automatic dependency installation**

## Current Status

Atria is in **early access** with all core features implemented and tested. The platform is currently in final CSS refinement phase, with plans for continuous feature enhancements based on user feedback.

**Planning a large-scale event or have special requirements?** Please [contact us](mailto:steven@sbtl.dev) to discuss your needs and ensure optimal performance for your specific use case.

### **Fully Implemented**

- Complete authentication and authorization system
- Multi-tenant organization and event management
- Real-time chat and messaging infrastructure
- Advanced session management with speaker coordination
- Comprehensive attendee management and invitation system
- Professional sponsor management with image optimization
- Role-based access control throughout the platform
- File upload and storage with security controls
- Email notifications and transactional messaging

### **Planned Features**

- Enhanced dashboard analytics
- Advanced reporting and analytics
- Mobile application
- Enhanced integration APIs
- Advanced security features (2FA, SSO)

## Deployment Options

### **Self-Hosted**

- Complete control over your data and customizations
- Free to use - you provide infrastructure and comply with AGPL-3.0 license
- Perfect for organizations with specific compliance requirements or nonprofits with limited budgets
- Full access to source code for custom modifications

### **Commercial Support**

For organizations requiring professional support, custom features, or consultation:

- **Custom Development** - Feature additions and modifications
- **Professional Support** - SLA-backed technical support
- **Training & Onboarding** - Team training and implementation guidance
- **Managed Hosting** - Fully managed deployment and maintenance

Contact: [steven@sbtl.dev](mailto:steven@sbtl.dev)

## Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help makes Atria better for everyone.

### **Before Contributing**

All contributors must sign our [Contributor License Agreement](CLA.md) to maintain our dual licensing model while accepting community contributions.

### **Getting Started**

1. Fork the repository
2. Create a feature branch
3. Make your changes following our coding standards
4. Add tests and update documentation
5. Submit a pull request

See our [Contributing Guidelines](CONTRIBUTING.md) for detailed information on development setup, coding standards, and the contribution process.

## Licensing

### **Open Source (AGPL-3.0)**

Atria is licensed under the [GNU Affero General Public License v3.0](LICENSE). You can:

- Use, modify, and distribute the software freely
- Run it for any purpose, including commercial use
- **Requirement**: Any modifications or derivative works must also be licensed under AGPL-3.0
- **Requirement**: If you run a modified version on a server, you must provide source code to users

### **Commercial License**

For organizations that cannot comply with AGPL-3.0 requirements, commercial licenses are available:

- Private modifications without source disclosure
- Integration into proprietary systems
- Custom support and SLA options
- No attribution requirements

### **Attribution Requirement**

Open source users must retain the attribution in the event navigation sidebar:
**"atria is made with ❤️ by sbtl"**

- "atria" links to https://atria.gg
- "sbtl" links to https://sbtl.dev

See [LICENSE-ATTRIBUTION.md](LICENSE-ATTRIBUTION.md) for complete details.

## Architecture

Atria follows modern software architecture principles with clear separation of concerns:

### **Backend Architecture**

- **API Layer**: Flask-Smorest with OpenAPI documentation
- **Service Layer**: Business logic separated from routing
- **Data Layer**: SQLAlchemy models with proper relationships
- **Real-time Layer**: Socket.IO for live features
- **Storage Layer**: MinIO for secure file management

### **Frontend Architecture**

- **Component-Based**: Reusable React components with proper state management
- **Feature Organization**: Logical grouping of related functionality
- **API Integration**: RTK Query for efficient data fetching and caching
- **Real-time Updates**: Socket.IO client integration
- **Type Safety**: TypeScript integration for enhanced development

### **Data Model**

- **Multi-Tenant**: Organization-scoped data isolation
- **Role-Based**: Hierarchical permission system
- **Relationship-Rich**: Proper associations between users, events, and organizations
- **Privacy-Aware**: Granular privacy controls built into the data model

## Support

- **Documentation**: Comprehensive API docs at `/new-swagger`
- **Community Support**: GitHub Issues and Discussions
- **Commercial Support**: Contact [steven@sbtl.dev](mailto:steven@sbtl.dev)

---

**Ready to transform your next event?** [Get started with Atria today](#-quick-start) and create networking experiences that last long after your event ends.

_Copyright © 2025 SBTL LLC - Made with ❤️ for meaningful connections_

# Changelog

All notable changes to Atria will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2025-12-24

### Added

- **Full TypeScript migration** - Complete frontend codebase converted from JavaScript to TypeScript (764 files)
- Comprehensive type definitions for all API responses, Redux state, and component props
- Strict type checking with `allowJs: false` and `verbatimModuleSyntax` enabled
- Custom type definitions for drag-and-drop (`dnd.ts`) and Vimeo player (`vimeo-player.d.ts`)

### Changed

- All RTK Query API slices now have full type coverage
- Socket.IO client fully typed with event payloads and callbacks
- Enum values standardized to UPPERCASE across frontend and backend for consistency
- Redux store, slices, and hooks converted to TypeScript with proper typing

### Fixed

- Type safety improvements eliminate runtime type errors
- Consistent enum handling between frontend and backend
- Modal Cancel buttons now use consistent custom Button styling across all modals
- Backend privacy service normalizes stored enum values to UPPERCASE for legacy data compatibility

[0.4.0]: https://github.com/thesubtleties/atria/releases/tag/v0.4.0

## [0.3.0] - 2025-11-26

### Added

- **Jitsi (JaaS) video conferencing** with per-user JWT authentication and moderator permissions
- **External platform support** for linking to any HTTPS streaming platform (MS Teams, self-hosted solutions, etc.)
- Documentation link in top navigation menu for easy access to docs.atria.gg

### Changed

- Dashboard events now prioritize live events first, then upcoming (soonest first), then recent past (up to 2 weeks old)

[0.3.0]: https://github.com/thesubtleties/atria/releases/tag/v0.3.0

## [0.2.1] - 2025-11-15

### Fixed

- Dev environment setup reliability - tmux helper scripts now detect project root dynamically
- Scripts can be executed from any directory location (previously required project root)
- Environment file configuration verified for consistency across example files

### Changed

- All dev helper scripts updated with dynamic project root detection
- Scripts now change to project root before running docker compose commands

[0.2.1]: https://github.com/thesubtleties/atria/releases/tag/v0.2.1

## [0.2.0] - 2025-11-08

### Added

- **Multi-platform video streaming** support for Vimeo, Mux, and Zoom
- **Mux BYOA (Bring Your Own Account)** with signed playback URLs and viewer analytics
- Organization settings UI for managing Mux credentials with expandable sections
- Fernet encryption for secure credential storage
- Content Security Policy support for Mux streaming domains
- Multi-platform video player components (MuxPlayer, VimeoPlayer, ZoomPlayer)
- Streaming platform validation in frontend forms

### Fixed

- Dev environment installation issues (#325 - database authentication, missing env vars)
- EditSessionModal scrolling when Mux platform fields displayed
- Backend dependencies (added cryptography package)

### Changed

- Session model extended with streaming platform fields
- Organization model extended with encrypted Mux credentials
- Session cards and modals updated with multi-platform streaming UI

### Security

- Mux private keys stored encrypted with Fernet
- CSP configured for trusted streaming providers only

[0.2.0]: https://github.com/thesubtleties/atria/releases/tag/v0.2.0

## [0.1.1] - 2025-10-31

### Fixed

- Documentation links in README (added missing `/docs` path segment to installation guide and API reference)

### Changed

- Version bumps across frontend and backend packages to 0.1.1

[0.1.1]: https://github.com/thesubtleties/atria/releases/tag/v0.1.1

## [0.1.0] - 2025-10-25

### Added

- Scrollable sections for organizations and news on dashboard with custom purple-themed scrollbars
- v0.1.0 release announcements in dashboard news with clickable documentation links
- Documentation and GitHub icon links in landing page navigation (desktop only)
- Comprehensive `.env.example` with 113 lines of detailed configuration guidance
- Script organization with dedicated `scripts/dev/`, `scripts/testing/`, and `scripts/database/` directories
- Script documentation in `scripts/README.md`

### Fixed

- **Critical**: Connection request privacy settings now properly enforced on backend
- **Critical**: Privacy preferences now validated server-side for all three levels (Event Attendees Only, Speakers & Organizers Only, No One)
- "Manage Sessions" navigation route in speakers manager (no more 404 errors)
- Plausible analytics double-counting on landing page
- OpenAPI documentation references for pagination endpoints
- Frontend linting errors throughout codebase
- React prop naming conventions (fetchpriority → fetchPriority)
- Double serialization errors in pagination endpoints

### Changed

- Flattened `api/api/` nested directory structure for cleaner project organization
- Updated README with accurate installation instructions and setup options
- Improved CONTRIBUTING.md with correct local development setup
- Simplified PR template from 57 to 23 lines for better adoption
- Optimized privacy checks to prevent N+1 query issues

### Documentation

- Complete rewrite of README with accurate prerequisites and installation steps
- Added reference to documentation repository (github.com/thesubtleties/atria-docs)
- All documentation now points to docs.atria.gg
- Removed references to non-existent documentation pages

### Developer Experience

- Organized root-level scripts into logical categories
- Improved code quality with resolved linting errors
- Better error handling in pagination endpoints
- Proper schema registration for Flask-SMOREST OpenAPI generation

[0.1.0]: https://github.com/thesubtleties/atria/releases/tag/v0.1.0

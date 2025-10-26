# Changelog

All notable changes to Atria will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

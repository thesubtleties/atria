# Contributing to Atria

Thank you for your interest in contributing to Atria! We welcome contributions from the community and are grateful for any help you can provide.

## Before You Contribute

### Contributor License Agreement (CLA)

**Important**: Before we can accept your contribution, you must sign our [Contributor License Agreement](CLA.md). This agreement ensures that:

1. You have the right to contribute the code
2. You grant SBTL LLC the necessary rights to use your contribution under both our open source (AGPL-3.0) and commercial licenses
3. Your contribution doesn't infringe on third-party rights

By submitting a pull request, you acknowledge that you have read and agree to the terms of the CLA.

### Code of Conduct

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## How to Contribute

### Reporting Issues

If you find a bug or have a feature request:

1. Check if the issue already exists in our [issue tracker](https://github.com/thesubtleties/atria/issues)
2. If not, create a new issue with:
   - A clear title and description
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Your environment details (OS, browser, etc.)

### Submitting Changes

1. **Fork the repository** and create your branch from `main`
2. **Make your changes**:
   - Write clear, concise commit messages
   - Follow existing code style and conventions
   - Add tests for new functionality
   - Update documentation as needed
3. **Test your changes**:
   - Run existing tests to ensure nothing breaks
   - Add new tests for your changes
   - Test manually in both development environments
4. **Submit a pull request**:
   - Fill out the pull request template completely
   - Reference any related issues
   - Ensure all CI checks pass

### Development Setup

#### Prerequisites
- Docker and Docker Compose
- Node.js 20+ and npm
- Python 3.13+
- PostgreSQL 15+

#### Local Development

1. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/atria.git
   cd atria
   ```

2. Copy environment files:
   ```bash
   cp .env.example .env.development
   ```
   Edit `.env.development` and configure at minimum: database credentials, MinIO/S3 storage, JWT secret keys.

3. Start development environment:

   **Option A: Using the interactive chooser (recommended)**
   ```bash
   ./dev-environment-chooser.sh
   ```
   Select option **1) Standard Local Development** for the simplest setup.

   **Option B: Direct Docker Compose (no tmux required)**
   ```bash
   docker-compose -f docker-compose.local-dev.yml up
   ```

4. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/new-swagger

**For detailed setup instructions including MinIO/S3 configuration, Redis, email, and troubleshooting**, see the [full installation guide](https://docs.atria.gg/getting-started/installation).

### Coding Standards

#### Backend (Python/Flask)
- Follow PEP 8 style guide
- Use type hints where possible
- Run `black` and `isort` for formatting
- Write docstrings for all functions and classes

#### Frontend (React/JavaScript)
- Follow existing ESLint configuration
- Use functional components with hooks
- Maintain consistent file organization
- Write JSDoc comments for complex functions

### Testing

- Write unit tests for new functionality
- Ensure all tests pass before submitting PR
- Aim for good test coverage
- Include both positive and negative test cases

### Documentation

- Update README.md if you change setup instructions
- Document new features or APIs
- Keep code comments up to date
- Add JSDoc/docstrings for public APIs
- **Update the docs site if necessary**: https://github.com/thesubtleties/atria-docs
  - Installation guides, API documentation, and user guides live in the docs repo
  - Keep documentation in sync with code changes

## Pull Request Process

1. Update the README.md with details of changes to the interface, if applicable
2. Ensure your PR description clearly describes the problem and solution
3. Link to any relevant issues
4. Request review from maintainers
5. Address review feedback promptly
6. Once approved, we will merge your PR

## Questions?

If you have questions about contributing, feel free to:
- Open a discussion in our [GitHub Discussions](https://github.com/thesubtleties/atria/discussions)
- Contact us at steven@sbtl.dev

Thank you for contributing to Atria!
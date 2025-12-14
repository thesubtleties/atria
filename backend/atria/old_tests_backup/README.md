# Old/Outdated Tests

This directory contains test files that are temporarily disabled from the main test suite.

## Why these tests are here:

- `test_celery.py` - Causes import errors, needs celery setup
- `test_auth.py` - Written for old API structure, needs rewriting
- `test_user.py` - Outdated user model tests, field names have changed
- `test_factory_debug.py` - Temporary debugging file
- `factories.py` - Old factory file, replaced by factories/ directory

## To restore a test:

1. Update it to match current codebase
2. Move it back to the appropriate tests/ subdirectory
3. Ensure it passes before committing

## Note:

Pytest will NOT automatically discover tests in directories starting with underscore (\_).
This allows us to keep the files for reference without them interfering with the test suite.

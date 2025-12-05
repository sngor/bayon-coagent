# Admin Platform Documentation

The Bayon Coagent Admin Platform provides comprehensive tools for managing users, monitoring platform health, moderating content, and configuring system features. Built with Next.js 15 and AWS services, it offers real-time analytics, robust security, and scalable infrastructure.

This documentation is organized by audience to help you quickly find what you need. Whether you're an admin using the platform, a developer integrating with the API, or a QA engineer testing features, there's a guide for you.

## Documentation by User Type

### 👤 I want to use the admin platform

**→ [User Guide](./USER_GUIDE.md)**

Complete guide for admins and super-admins covering all platform features, common workflows, and troubleshooting.

### 🔌 I want to integrate with the API

**→ [API Reference](./API_REFERENCE.md)**

Complete API documentation with authentication, endpoints, schemas, error codes, and integration examples.

### 🛠️ I want to develop or extend features

**→ [Developer Guide](./DEVELOPER_GUIDE.md)**

Technical implementation guide covering architecture, database design, service patterns, testing, and deployment.

### 🧪 I want to test the system

**→ [Testing Guide](./TESTING_GUIDE.md)**

Comprehensive testing documentation including unit tests, integration tests, load tests, and manual QA procedures.

## Additional Resources

### 📋 [Changelog](./CHANGELOG.md)

Version history, task completion timeline, key architectural decisions, and migration notes.

### 🔄 [Migration Guide](./MIGRATION_GUIDE.md)

**New!** Guide for navigating the reorganized documentation structure. If you had bookmarks to old files, this guide shows you where to find that content now.

### 📦 [Archive](./archive/)

Historical task summaries and deprecated documentation. See [Task Summaries Index](./archive/TASK_SUMMARIES_INDEX.md) for key decisions from past implementations.

## Quick Links

- **Getting Started**: [User Guide - Getting Started](./USER_GUIDE.md#getting-started)
- **Authentication**: [API Reference - Authentication](./API_REFERENCE.md#authentication)
- **Architecture**: [Developer Guide - Architecture](./DEVELOPER_GUIDE.md#architecture-overview)
- **Running Tests**: [Testing Guide - Quick Start](./TESTING_GUIDE.md#quick-start)

## Documentation Structure

This documentation follows a **single source of truth** principle - each piece of information exists in exactly one place:

- **USER_GUIDE.md**: User-facing instructions only (no technical implementation)
- **API_REFERENCE.md**: API schemas and endpoints only (no user workflows)
- **DEVELOPER_GUIDE.md**: Technical implementation only (no user instructions)
- **TESTING_GUIDE.md**: Testing procedures only (consolidated from multiple sources)

When documents need to reference each other, they use links rather than duplicating content. This makes maintenance easier and ensures consistency.

### Recent Changes

**December 2024**: Documentation reorganized to eliminate redundancy

- Consolidated 30+ files into 6 core documents
- Moved task summaries to archive with index
- Created migration guide for bookmark updates
- See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for details

## Support

- **Admin Support**: admin-support@bayoncoagent.com
- **Developer Support**: dev-support@bayoncoagent.com
- **Slack**: #admin-support (admins) | #dev-support (developers)

## Contributing to Documentation

When adding new documentation:

1. **Choose the right document** based on content type (see Documentation Structure above)
2. **Use cross-references** instead of duplicating content
3. **Update this README** if adding new top-level documents
4. **Follow the existing format** in each document

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed guidelines on where to document different types of content.

---

_Last Updated: December 2024_

# Nest Starter Template

## Description

A production-ready NestJS starter template with robust authentication, role-based access control, and file uploads. Features include JWT authentication, email verification, password reset, and Cloudinary integration.

## Features

- 🔐 JWT Authentication with access & refresh tokens
- 👥 Role-based access control (User, Admin, Super Admin)
- 📧 Email verification flow
- 🔑 Secure password reset
- 📁 File uploads with Cloudinary
- 🚫 Token blacklisting with Redis
- 📝 OpenAPI/Swagger documentation
- 🧪 Comprehensive test coverage
- 🐳 Docker compose setup
- 🔄 Auto-refresh tokens
- ⚡ Request validation
- 📊 Error handling

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL + TypeORM
- **Caching**: Redis
- **Storage**: Cloudinary
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Containerization**: Docker

## Quick Start

```bash
# Clone the template
npx degit BenjaminChoron/nest-starter-template my-project

# Install dependencies
cd my-project && npm install

# Configure environment
cp .env.example .env

# Start services
docker-compose up -d

# Run migrations
npm run migration:run

# Start development server
npm run start:dev
```

## API Documentation

Access the interactive API documentation at:

```
http://localhost:3000/api
```

### Core Endpoints

**Authentication:**

- `POST /auth/register` - Create new account
- `POST /auth/login` - Authenticate user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Invalidate tokens
- `GET /auth/me` - Get current user

**Users:**

- `GET /users` - List all users (Admin)
- `GET /users/:id` - Get user details
- `GET /users/email/:email` - Get user by email
- `PATCH /users/:id` - Update user
- `POST /users/:id/avatar` - Upload avatar
- `PATCH /users/:id/role` - Update user role (Super Admin)
- `DELETE /users/:id` - Delete user (Admin)

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## License

MIT

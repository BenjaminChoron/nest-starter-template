# Nest Starter Template

## Description

A production-ready NestJS starter template with robust authentication, role-based access control, and file uploads. Features include JWT authentication, email verification, password reset, and Cloudinary integration.

## Features

- 🔐 JWT Authentication with access & refresh tokens
- 👥 Role-based access control (User, Admin, Super Admin)
- 📧 Email verification flow
- 🔑 Secure password reset
- 🔒 Enhanced password security
- 📁 File uploads with Cloudinary
- 🚫 Token blacklisting with Redis
- 📝 OpenAPI/Swagger documentation
- 🐳 Docker compose setup
- ⚡ Request validation
- 📊 Error handling

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL + TypeORM
- **Caching**: Redis
- **Storage**: Cloudinary
- **Email**: SendGrid
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
- `POST /auth/check-password-strength` - Analyze password strength

**Password Management:**

- `POST /auth/request-password-reset` - Request password reset
- `POST /auth/reset-password` - Reset password with token

**Email Verification:**

- `POST /auth/verify-email` - Verify email address
- `POST /auth/resend-verification` - Resend verification email

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

This project is unlicensed.

## Password Security Features

The application includes enhanced password security:

- Password strength analysis using zxcvbn

  - Score-based evaluation (0-4)
  - Crack time estimation
  - Detailed feedback and suggestions

- Password History Management

  - Prevents reuse of last 5 passwords
  - Tracks password change dates
  - Enforces password change policies

- Password Validation

  - Minimum length: 8 characters
  - Must contain uppercase & lowercase letters
  - Must contain numbers
  - Must contain special characters
  - Cannot reuse recent passwords

- Secure Reset Flow
  - Time-limited reset tokens
  - Secure email delivery
  - Previous session invalidation
  - Password history validation

## API Security Features

- Rate limiting on sensitive endpoints
- Token blacklisting
- Session management
- Email verification
- Role-based access control

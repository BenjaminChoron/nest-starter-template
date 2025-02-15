# Nest Starter Template

## Description

This is a starter template for a NestJS application. It includes a robust authentication system with JWT tokens, email verification, and password reset functionality. Built on top of PostgreSQL with Redis for token management.

## Stack

- [NestJS](https://nestjs.com/)
- [Docker](https://www.docker.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)
- [TypeORM](https://typeorm.io/)
- [JWT](https://jwt.io/)
- [Swagger](https://swagger.io/)
- [Cloudinary](https://cloudinary.com/)

## Features

- JWT-based authentication with access & refresh tokens
- Token blacklisting with Redis
- Email verification flow
- Password reset functionality
- User management
- Comprehensive test coverage
- Swagger API documentation

## Installation

Clone the repo and run `npm install` in the project directory\
or\
Run those commands in your terminal:

```bash
$ npx degit BenjaminChoron/nest-starter-template project-name
$ cd project-name
$ npm install
```

## Configuration

Create a `.env` file at the root of the project using the `.env.example` file as a template.

## Running the app

First, start the required services:

```bash
# Start PostgreSQL and Redis
$ docker-compose up -d
```

Then run the application:

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Documentation

The API documentation is available via Swagger. Once the application is running, visit:

```
http://localhost:3000/api
```

![Swagger screenshot](/assets/screenshots/swagger.png)

### Main Endpoints

Authentication:

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user profile

Email Verification:

- `POST /auth/verify-email` - Verify email address
- `POST /auth/resend-verification` - Resend verification email

Password Management:

- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

## Testing

The application includes comprehensive test coverage:

- Unit tests for services
- E2E tests for API endpoints
- Integration tests for database operations

Tests use a separate database and Redis instance. Ensure both are running:

```bash
# Create test database
$ createdb auth_api_test

# Verify Redis is running
$ docker-compose ps
```

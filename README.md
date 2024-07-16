# Nest Starter Template

## Description

This is a starter template for a NestJS application. It includes a basic setup for a REST API with a PostgreSQL database on a docker container, user JWT authentication, swagger documentation and images upload.

## Stack

- [NestJS](https://nestjs.com/)
- [Docker](https://www.docker.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [TypeORM](https://typeorm.io/)
- [JWT](https://jwt.io/)
- [Swagger](https://swagger.io/)
- [Cloudinary](https://cloudinary.com/)
- ...

## Installation

Clone the repo and run `npm install` in the project directory\
or\
Run those commands in your terminal:

```bash
$ npx degit BenjaminChoron/nest-starter-template project-name
$ cd project-name
$ npm install
```

## Running the app

- First, you need to create a `.env`file at the root of the project using the `.env.example` file as a template.
- Then, you need to run `docker-compose up` at the root of the project to start the databases containers.
- Then, you can run the app with the following commands:

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

To open Swagger documentation of the API routes, run the app and go to `http://localhost:3000/swagger` in your browser.

![Swagger screenshot](/assets/screenshots/swagger.png)

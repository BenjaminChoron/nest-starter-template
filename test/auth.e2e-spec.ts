import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Redis } from 'ioredis';
import { User } from '../src/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let redisClient: Redis;

  const testUser = {
    email: 'test@example.com',
    password: 'StrongP@ss123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );

    dataSource = app.get(DataSource);
    redisClient = app.get('REDIS_CLIENT');

    await app.init();
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
    await redisClient.flushall();
  });

  describe('Authentication', () => {
    describe('Registration', () => {
      it('should register a new user', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser)
          .expect(201)
          .expect(({ body }) => {
            expect(body.user.email).toBe(testUser.email);
            expect(body.user.password).toBeUndefined();
            expect(body.accessToken).toBeDefined();
            expect(body.refreshToken).toBeDefined();
          });
      });

      it('should not register with weak password', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({ ...testUser, password: 'weak' })
          .expect(400)
          .expect(({ body }) => {
            expect(body.message).toEqual([
              'Password must contain uppercase letter',
              'password must be longer than or equal to 8 characters',
            ]);
          });
      });
    });

    describe('Email Verification', () => {
      let verificationToken: string;

      beforeEach(async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser)
          .expect(201);

        const user = await dataSource.getRepository(User).findOne({
          where: { email: testUser.email },
          select: ['emailVerificationToken'],
        });

        verificationToken = user.emailVerificationToken;
      });

      it('should verify email with valid token', () => {
        return request(app.getHttpServer())
          .post('/auth/verify-email')
          .send({ token: verificationToken })
          .expect(201); // Keep 201 for creation
      });

      it('should not verify with invalid token', () => {
        return request(app.getHttpServer())
          .post('/auth/verify-email')
          .send({ token: 'invalid-token' })
          .expect(401);
      });

      it('should not login before email verification', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send(testUser)
          .expect(403)
          .expect(({ body }) => {
            expect(body.message).toBe('Email not verified');
          });
      });
    });

    describe('Password Reset', () => {
      let resetToken: string;

      beforeEach(async () => {
        // Register and verify email
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser)
          .expect(201);

        const user = await dataSource.getRepository(User).findOne({
          where: { email: testUser.email },
          select: ['emailVerificationToken', 'id'],
        });

        await request(app.getHttpServer())
          .post('/auth/verify-email')
          .send({ token: user.emailVerificationToken })
          .expect(201);

        // Generate reset token directly using JWT
        const jwtService = app.get(JwtService);
        const configService = app.get(ConfigService);

        resetToken = await jwtService.signAsync(
          { sub: user.id, email: testUser.email },
          {
            secret: configService.get('JWT_RESET_PASSWORD_SECRET'),
            expiresIn: '15m',
          },
        );
      });

      it('should reset password with valid token', () => {
        const newPassword = 'NewStrongP@ss123';

        return request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            token: resetToken,
            newPassword,
          })
          .expect(201)
          .then(() => {
            return request(app.getHttpServer())
              .post('/auth/login')
              .send({
                email: testUser.email,
                password: newPassword,
              })
              .expect(201);
          });
      });

      it('should not reset with invalid token', () => {
        return request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            token: 'invalid-token',
            newPassword: 'NewStrongP@ss123',
          })
          .expect(401);
      });

      it('should not reset with weak password', () => {
        return request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            token: resetToken,
            password: 'weak',
          })
          .expect(400);
      });
    });
  });

  afterAll(async () => {
    try {
      if (redisClient?.status === 'ready') {
        await redisClient.flushall();
        await redisClient.disconnect(false);
      }

      await dataSource?.destroy();
      await app?.close();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });
});

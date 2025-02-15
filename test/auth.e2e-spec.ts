import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Redis } from 'ioredis';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let redisClient: Redis;
  let accessToken: string;
  let refreshToken: string;
  const testUser = {
    email: 'test@example.com',
    password: 'Pa$$w0rd!',
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

    if (redisClient.status === 'ready') {
      await redisClient.flushall();
    }
  });

  afterEach(async () => {
    if (redisClient.status === 'ready') {
      await redisClient.flushall();
    }
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

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.password).toBeUndefined();

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should not register with invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...testUser, email: 'invalid-email' })
        .expect(400)
        .expect(({ body }) => {
          expect(body.message[0]).toBe('email must be an email');
        });
    });

    it('should not register with weak password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...testUser, password: 'weak' })
        .expect(400)
        .expect(({ body }) => {
          expect(body.message).toEqual(
            expect.arrayContaining([
              'Password must contain at least one uppercase letter',
              'Password must be at least 8 characters long',
            ]),
          );
        });
    });

    it('should not register duplicate email', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      // Duplicate registration
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('should login with valid credentials', async () => {
      // Register first
      await request(app.getHttpServer()).post('/auth/register').send(testUser);

      // Then login
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(testUser)
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should not login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ ...testUser, password: 'wrong' })
        .expect(401);
    });

    describe('Protected Routes', () => {
      beforeEach(async () => {
        // Register and login before each protected route test
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser);

        const loginResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send(testUser);

        accessToken = loginResponse.body.accessToken;
        refreshToken = loginResponse.body.refreshToken;
      });

      it('should get user profile with valid token', () => {
        return request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect(({ body }) => {
            expect(body.email).toBe(testUser.email);
            expect(body.password).toBeUndefined();
          });
      });

      it('should refresh tokens with valid refresh token', () => {
        return request(app.getHttpServer())
          .post('/auth/refresh')
          .set('Authorization', `Bearer ${refreshToken}`)
          .expect(201)
          .expect(({ body }) => {
            expect(body.accessToken).toBeDefined();
            expect(body.refreshToken).toBeDefined();
            accessToken = body.accessToken;
            refreshToken = body.refreshToken;
          });
      });

      it('should logout successfully', () => {
        return request(app.getHttpServer())
          .post('/auth/logout')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(201);
      });

      it('should not access protected routes after logout', async () => {
        // First logout
        await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(201);

        // Then try to access protected route with same token
        return request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(401);
      });
    });

    // Move these to outside the Protected Routes describe block
    it('should not get profile without token', () => {
      return request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('should not refresh tokens with access token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });

    describe('Password Reset', () => {
      beforeEach(async () => {
        // Register user before testing password reset
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser);
      });

      it('should send reset token for existing email', () => {
        return request(app.getHttpServer())
          .post('/auth/forgot-password')
          .send({ email: testUser.email })
          .expect(201)
          .expect(({ body }) => {
            expect(body.message).toBe(
              'If the email exists, a reset token has been sent',
            );
          });
      });

      it('should not reveal if email does not exist', () => {
        return request(app.getHttpServer())
          .post('/auth/forgot-password')
          .send({ email: 'nonexistent@example.com' })
          .expect(201)
          .expect(({ body }) => {
            expect(body.message).toBe(
              'If the email exists, a reset token has been sent',
            );
          });
      });
    });

    describe('Email Verification', () => {
      let verificationToken: string;

      beforeEach(async () => {
        // Register a new user to get verification token
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser);

        // Get token from user (in real app this would be sent via email)
        const user = await dataSource
          .getRepository('users')
          .findOne({ where: { email: testUser.email } });

        verificationToken = user.emailVerificationToken;
      });

      it('should verify email with valid token', () => {
        return request(app.getHttpServer())
          .post('/auth/verify-email')
          .send({ token: verificationToken })
          .expect(201);
      });

      it('should not verify with invalid token', () => {
        return request(app.getHttpServer())
          .post('/auth/verify-email')
          .send({ token: 'invalid-token' })
          .expect(401);
      });

      it('should resend verification email', async () => {
        // Login first
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser);

        const loginResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send(testUser);

        return request(app.getHttpServer())
          .post('/auth/resend-verification')
          .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
          .expect(201);
      });
    });

    describe('Token Management', () => {
      let userAccessToken: string;

      beforeEach(async () => {
        // Register and login before each test
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser);

        const loginResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send(testUser);

        userAccessToken = loginResponse.body.accessToken;
      });

      it('should not allow using same token after logout', async () => {
        // Logout
        await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Authorization', `Bearer ${userAccessToken}`)
          .expect(201);

        // Try to use token
        await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${userAccessToken}`)
          .expect(401);
      });

      it('should allow login after logout', async () => {
        // Logout
        await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Authorization', `Bearer ${userAccessToken}`)
          .expect(201);

        // Login again
        return request(app.getHttpServer())
          .post('/auth/login')
          .send(testUser)
          .expect(201)
          .expect(({ body }) => {
            expect(body.accessToken).toBeDefined();
            expect(body.refreshToken).toBeDefined();
          });
      });
    });
  });
});

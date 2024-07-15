import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { rm } from 'fs';
import { join } from 'path';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  const testEmail = 'test@mail.com';
  const testPassword = 'Pa$$w0rd';

  beforeAll(async () => {
    // Remove the test database before running the tests
    try {
      await rm(join(__dirname, '..', 'test.sqlite'), () => null);
    } catch (err) {}
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('handles a signup request', () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: testEmail, password: testPassword })
      .expect(201)
      .then((res) => {
        const { access_token } = res.body;
        expect(access_token).toBeDefined();
        expect(access_token).toEqual(expect.any(String));
      });
  });

  it('signup as a new user then get the currently logged in user', async () => {
    const anotherEmail = 'test1@mail.com';

    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: anotherEmail, password: testPassword })
      .expect(201);

    const { body } = await request(app.getHttpServer())
      .get('/auth/whoami')
      .set('Authorization', `Bearer ${res.body.access_token}`)
      .expect(200);

    expect(body.email).toEqual(anotherEmail);
  });

  it('handles a signin request', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(201)
      .then((res) => {
        const { access_token } = res.body;
        expect(access_token).toBeDefined();
        expect(access_token).toEqual(expect.any(String));
      });
  });

  it('login user then get the current user infos', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(201);

    const { body } = await request(app.getHttpServer())
      .get('/auth/whoami')
      .set('Authorization', `Bearer ${res.body.access_token}`)
      .expect(200);

    expect(body.email).toEqual(testEmail);
  });
});

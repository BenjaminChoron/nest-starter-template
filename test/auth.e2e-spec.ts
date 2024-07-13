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
        const { uuid, email } = res.body;
        expect(uuid).toBeDefined();
        expect(email).toEqual(testEmail);
      });
  });

  it('signup as a new user then get the currently logged in user', async () => {
    const anotherEmail = 'test1@mail.com';

    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: anotherEmail, password: testPassword })
      .expect(201);

    const cookie = res.get('Set-Cookie');

    const { body } = await request(app.getHttpServer())
      .get('/auth/whoami')
      .set('Cookie', cookie)
      .expect(200);

    expect(body.email).toEqual(anotherEmail);
  });

  it('handles a signin request', () => {
    return request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: testEmail, password: testPassword })
      .expect(201)
      .then((res) => {
        const { uuid, email } = res.body;
        expect(uuid).toBeDefined();
        expect(email).toEqual(testEmail);
      });
  });

  it('handles a signout request', () => {
    return request(app.getHttpServer())
      .post('/auth/signout')
      .expect(201)
      .then((res) => {
        expect(res.body).toEqual({});
      });
  });

  it('should not be possible to update a user if not signed in', async () => {
    const newEmail = 'test2@mail.com';

    const res = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: testEmail, password: testPassword })
      .expect(201);

    const cookie = null;
    const userUuid = res.body.uuid;

    return request(app.getHttpServer())
      .patch(`/auth/${userUuid}`)
      .set('Cookie', cookie)
      .send({ email: newEmail })
      .expect(403);
  });

  it('should be possible to update a user if signed in', async () => {
    const newEmail = 'test2@mail.com';

    const res = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: testEmail, password: testPassword })
      .expect(201);

    const cookie = res.get('Set-Cookie');
    const userUuid = res.body.uuid;

    const { body } = await request(app.getHttpServer())
      .patch(`/auth/${userUuid}`)
      .set('Cookie', cookie)
      .send({ email: newEmail })
      .expect(200);

    expect(body.email).toEqual(newEmail);
  });

  it('should not be possible to delete a user if not signed in', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: 'test2@mail.com', password: testPassword })
      .expect(201);

    const cookie = null;
    const userUuid = res.body.uuid;

    return request(app.getHttpServer())
      .delete(`/auth/${userUuid}`)
      .set('Cookie', cookie)
      .expect(403);
  });

  it('should be possible to delete a user if signed in', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: 'test2@mail.com', password: testPassword })
      .expect(201);

    const cookie = res.get('Set-Cookie');
    const userUuid = res.body.uuid;

    return request(app.getHttpServer())
      .delete(`/auth/${userUuid}`)
      .set('Cookie', cookie)
      .expect(200);
  });
});

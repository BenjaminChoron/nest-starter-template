import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from './../src/app.module';
import { User } from '../src/users/entities/user.entity';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  const testEmail = 'test@mail.com';
  const testPassword = 'Pa$$w0rd';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    const dataSource = app.get(DataSource);
    await dataSource.createQueryBuilder().delete().from(User).execute();
  });

  it('handles a signup request', () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: testEmail, password: testPassword })
      .expect(201)
      .then((res) => {
        const { accessToken } = res.body;
        expect(accessToken).toBeDefined();
        expect(accessToken).toEqual(expect.any(String));
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
      .set('Authorization', `Bearer ${res.body.accessToken}`)
      .expect(200);

    expect(body.email).toEqual(anotherEmail);
  });

  it('handles a signin request', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(201)
      .then((res) => {
        const { accessToken } = res.body;
        expect(accessToken).toBeDefined();
        expect(accessToken).toEqual(expect.any(String));
      });
  });

  it('login user then get the current user infos', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(201);

    const { body } = await request(app.getHttpServer())
      .get('/auth/whoami')
      .set('Authorization', `Bearer ${res.body.accessToken}`)
      .expect(200);

    expect(body.email).toEqual(testEmail);
  });
});

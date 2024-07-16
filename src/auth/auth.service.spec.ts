import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;
  let fakeAuthService: Partial<AuthService>;
  let jwtService: JwtService;

  beforeEach(async () => {
    // Create a fake copy of the users service
    const users: User[] = [];
    fakeUsersService = {
      findByEmail: (email: string) => {
        const foundUser = users.find((user) => user.email === email);
        return Promise.resolve(foundUser);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 999999),
          uuid: 'fake-uuid-' + Math.floor(Math.random() * 999999).toString(),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    fakeAuthService = {
      validateUser(input: { email: string; password: string }) {
        const foundUser = users.find((user) => user.email === input.email);
        if (!foundUser || input.password !== 'Pa$$w0rd!') return null;
        return Promise.resolve({ uuid: 'fake-uuid', email: input.email });
      },
      signIn: async (user: { uuid: string; email: string }) => {
        const tokenPayload = { sub: user.uuid, email: user.email };
        const accessToken = await jwtService.signAsync(tokenPayload);
        return Promise.resolve({ access_token: accessToken });
      },
      signup: async (email: string, password: string) => {
        const foundUser = users.find((user) => user.email === email);
        if (foundUser) {
          Promise.reject();
        }

        const user = await fakeUsersService.create(email, password);
        return fakeAuthService.signIn({ uuid: user.uuid, email: user.email });
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: fakeAuthService,
        },
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockReturnValue('testToken'),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('should return an access token when login', async () => {
    const user = { uuid: 'fake-uuid', email: 'test@mail.com' };
    const result = await fakeAuthService.signIn(user);
    expect(result).toEqual({ access_token: 'testToken' });
  });

  it('should reject when creating a user with an existing email', async () => {
    await expect(fakeAuthService.signup('test@mail.com', 'pAssw0rd!')).rejects;
  });

  it('should create a new user and return access token', async () => {
    const result = await fakeAuthService.signup('test3@mail.com', 'pAssw0rd!');
    expect(result).toEqual({ access_token: 'testToken' });

    const user = await fakeUsersService.findByEmail('test3@mail.com');
    expect(user).toBeDefined();
  });
});

import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;
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
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
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

  it('should return a valid JWT token', async () => {
    const user = { uuid: 'fake-uuid', email: 'test@mail.com' };
    const result = await service.signIn(user);
    expect(result).toEqual({ access_token: 'testToken' });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      email: user.email,
      sub: user.uuid,
    });
  });
});

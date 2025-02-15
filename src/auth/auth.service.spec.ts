import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let tokenBlacklistService: TokenBlacklistService;

  const mockUser = {
    id: '123',
    email: 'test@example.com',
  } as User;

  const tokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            updateLastLogin: jest.fn(),
            setRefreshToken: jest.fn(),
            removeRefreshToken: jest.fn(),
            validateRefreshToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendVerificationEmail: jest.fn(),
          },
        },
        {
          provide: TokenBlacklistService,
          useValue: {
            blacklist: jest.fn(),
            isBlacklisted: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    tokenBlacklistService = module.get<TokenBlacklistService>(
      TokenBlacklistService,
    );

    // Setup default mock implementations
    usersService.findById.mockResolvedValue(mockUser);
    usersService.validateRefreshToken.mockResolvedValue(true);
    jest.spyOn(service as any, 'getTokens').mockResolvedValue(tokens);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should generate tokens and update last login', async () => {
      // Setup the resolved value for setRefreshToken
      usersService.setRefreshToken.mockResolvedValueOnce(undefined);

      const result = await service.login(mockUser);

      expect(result.accessToken).toBe(tokens.accessToken);
      expect(result.refreshToken).toBe(tokens.refreshToken);
      expect(usersService.setRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        tokens.refreshToken,
      );
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('logout', () => {
    it('should blacklist token and remove refresh token', async () => {
      const token = 'test-token';
      usersService.findById.mockResolvedValueOnce(mockUser);

      await service.logout(mockUser.id, token);

      expect(tokenBlacklistService.blacklist).toHaveBeenCalledWith(token);
      expect(usersService.removeRefreshToken).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw if user not found', async () => {
      usersService.findById.mockResolvedValueOnce(null);

      await expect(service.logout('invalid-id', 'token')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('refreshTokens', () => {
    it('should generate new tokens if refresh token is valid', async () => {
      const result = await service.refreshTokens(
        mockUser.id,
        'old-refresh-token',
      );

      expect(result).toEqual(tokens);
      expect(usersService.setRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        tokens.refreshToken,
      );
    });

    it('should throw if refresh token is invalid', async () => {
      // Override the default mock for this test
      usersService.validateRefreshToken.mockResolvedValueOnce(false);

      await expect(
        service.refreshTokens(mockUser.id, 'invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});

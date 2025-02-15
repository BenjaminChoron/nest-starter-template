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
  let usersService: UsersService;
  let tokenBlacklistService: TokenBlacklistService;

  const mockUser = {
    id: '123',
    email: 'test@example.com',
    password: '$2b$10$test',
  } as User;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    setRefreshToken: jest.fn(),
    validateRefreshToken: jest.fn(),
    removeRefreshToken: jest.fn(),
    updateLastLogin: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  const mockTokenBlacklistService = {
    blacklist: jest.fn(),
    isBlacklisted: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: TokenBlacklistService,
          useValue: mockTokenBlacklistService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    tokenBlacklistService = module.get<TokenBlacklistService>(
      TokenBlacklistService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should generate tokens and update last login', async () => {
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockJwtService.signAsync.mockResolvedValueOnce(tokens.accessToken);
      mockJwtService.signAsync.mockResolvedValueOnce(tokens.refreshToken);

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
      mockUsersService.findById.mockResolvedValueOnce(mockUser);

      await service.logout(mockUser.id, token);

      expect(tokenBlacklistService.blacklist).toHaveBeenCalledWith(token);
      expect(usersService.removeRefreshToken).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw if user not found', async () => {
      mockUsersService.findById.mockResolvedValueOnce(null);

      await expect(service.logout('invalid-id', 'token')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('refreshTokens', () => {
    it('should generate new tokens if refresh token is valid', async () => {
      const tokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockUsersService.findById.mockResolvedValueOnce(mockUser);
      mockUsersService.validateRefreshToken.mockResolvedValueOnce(true);
      mockJwtService.signAsync.mockResolvedValueOnce(tokens.accessToken);
      mockJwtService.signAsync.mockResolvedValueOnce(tokens.refreshToken);

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
      mockUsersService.findById.mockResolvedValueOnce(mockUser);
      mockUsersService.validateRefreshToken.mockResolvedValueOnce(false);

      await expect(
        service.refreshTokens(mockUser.id, 'invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});

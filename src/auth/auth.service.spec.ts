import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { PasswordHistoryService } from './services/password-history.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let tokenBlacklistService: jest.Mocked<TokenBlacklistService>;
  let passwordHistoryService: jest.Mocked<PasswordHistoryService>;
  let emailService: jest.Mocked<EmailService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword123',
    refreshToken: null,
    isEmailVerified: true,
  } as User;

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
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
            create: jest.fn(),
            setRefreshToken: jest.fn(),
            removeRefreshToken: jest.fn(),
            validateRefreshToken: jest.fn(),
            updateLastLogin: jest.fn(),
            updatePassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
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
            sendPasswordResetEmail: jest.fn(),
          },
        },
        {
          provide: TokenBlacklistService,
          useValue: {
            blacklist: jest.fn(),
            isBlacklisted: jest.fn(),
          },
        },
        {
          provide: PasswordHistoryService,
          useValue: {
            addToHistory: jest.fn(),
            isPasswordReused: jest.fn().mockResolvedValue(false),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    tokenBlacklistService = module.get(TokenBlacklistService);
    passwordHistoryService = module.get(PasswordHistoryService);
    emailService = module.get(EmailService);
    configService = module.get(ConfigService);
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const password = 'correctPassword';
      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => true as any);

      const result = await service.validateUser(mockUser.email, password);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException with incorrect password', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => false as any);

      await expect(
        service.validateUser(mockUser.email, 'wrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should generate tokens and update user', async () => {
      jwtService.signAsync.mockResolvedValueOnce(mockTokens.accessToken);
      jwtService.signAsync.mockResolvedValueOnce(mockTokens.refreshToken);

      const result = await service.login(mockUser);

      expect(usersService.setRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        mockTokens.refreshToken,
      );
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens for valid refresh token', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      usersService.validateRefreshToken.mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValueOnce(mockTokens.accessToken);
      jwtService.signAsync.mockResolvedValueOnce(mockTokens.refreshToken);

      const result = await service.refreshTokens(
        mockUser.id,
        'valid-refresh-token',
      );

      expect(result).toEqual(mockTokens);
      expect(usersService.setRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        mockTokens.refreshToken,
      );
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      usersService.validateRefreshToken.mockResolvedValue(false);

      await expect(
        service.refreshTokens(mockUser.id, 'invalid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should blacklist token and remove refresh token', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      await service.logout(mockUser.id, mockTokens.accessToken);

      expect(tokenBlacklistService.blacklist).toHaveBeenCalledWith(
        mockTokens.accessToken,
      );
      expect(usersService.removeRefreshToken).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('resetPassword', () => {
    const mockToken = 'valid-reset-token';
    const mockNewPassword = 'NewStrongP@ss123';
    const mockUserId = '1';
    const mockJwtSecret = 'test-jwt-secret';

    beforeEach(() => {
      jwtService.verifyAsync.mockResolvedValue({ sub: mockUserId });
      configService.get.mockReturnValue(mockJwtSecret);
    });

    it('should reset password successfully', async () => {
      await service.resetPassword(mockToken, mockNewPassword);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockToken, {
        secret: mockJwtSecret,
      });
      expect(passwordHistoryService.isPasswordReused).toHaveBeenCalledWith(
        mockUserId,
        mockNewPassword,
      );
    });

    it('should throw if password was recently used', async () => {
      passwordHistoryService.isPasswordReused.mockResolvedValue(true);

      await expect(
        service.resetPassword(mockToken, mockNewPassword),
      ).rejects.toThrow('Password was recently used');
    });

    it('should throw if reset token is invalid', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error());

      await expect(
        service.resetPassword(mockToken, mockNewPassword),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateResetToken', () => {
    it('should generate and send reset token', async () => {
      const mockEmail = 'test@example.com';
      const mockToken = 'generated-reset-token';
      usersService.findByEmail.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue(mockToken);

      await service.generateResetToken(mockEmail);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email },
        expect.any(Object),
      );
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockEmail,
        mockToken,
      );
    });

    it('should not throw if email does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.generateResetToken('nonexistent@example.com'),
      ).resolves.not.toThrow();
    });
  });
});

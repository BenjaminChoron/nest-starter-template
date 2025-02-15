import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { ImagesService } from '../utils/images.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = {
    id: '123',
    email: 'test@example.com',
    password: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
  };

  const mockImagesService = {
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: ImagesService,
          useValue: mockImagesService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should create a new user', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null);
      mockRepository.create.mockReturnValueOnce(mockUser);
      mockRepository.save.mockResolvedValueOnce(mockUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        email: createUserDto.email.toLowerCase().trim(),
      });
    });

    it('should throw ConflictException if email exists', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(mockUser);

      const result = await service.findById(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        id: mockUser.id,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        email: mockUser.email.toLowerCase().trim(),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOneBy.mockResolvedValueOnce(null);

      await expect(
        service.findByEmail('nonexistent@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setRefreshToken', () => {
    it('should update refresh token', async () => {
      const token = 'refresh-token';
      mockRepository.update.mockResolvedValueOnce({ affected: 1 });

      await service.setRefreshToken(mockUser.id, token);

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: mockUser.id },
        expect.objectContaining({ refreshToken: expect.any(String) }),
      );
    });

    it('should throw if update fails', async () => {
      mockRepository.update.mockRejectedValueOnce(
        new InternalServerErrorException(),
      );

      await expect(
        service.setRefreshToken(mockUser.id, 'token'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});

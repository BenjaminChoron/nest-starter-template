import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { Role } from '../enums/role.enum';

@Exclude()
export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ enum: Role, example: Role.USER })
  @Expose()
  role: Role;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @Expose()
  avatar?: string;

  @ApiProperty({ example: true })
  @Expose()
  isEmailVerified: boolean;

  @ApiProperty({ example: '2024-02-16T12:00:00Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2024-02-16T12:00:00Z', required: false })
  @Expose()
  lastLoginAt?: Date;

  @ApiProperty({ example: '2024-02-16T12:00:00Z' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ example: true })
  @Expose()
  isActive: boolean;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

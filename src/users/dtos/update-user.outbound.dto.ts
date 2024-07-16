import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class UpdateUserOutboundDto {
  @ApiProperty({
    required: false,
    example: 'test@mail.com',
  })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty({
    required: false,
    example: 'Password123!',
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @IsOptional()
  password: string;

  @ApiProperty({
    required: false,
    example: 'https://example.com/avatar.png',
  })
  @IsString()
  @IsOptional()
  avatar: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'Password must contain uppercase letter' })
  @Matches(/[a-z]/, { message: 'Password must contain lowercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain number' })
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, {
    message: 'Password must contain special character',
  })
  newPassword: string;

  @ApiProperty()
  @IsString()
  token: string;
}

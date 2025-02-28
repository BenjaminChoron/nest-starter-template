import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CheckPasswordStrengthDto {
  @ApiProperty()
  @IsString()
  password: string;
}

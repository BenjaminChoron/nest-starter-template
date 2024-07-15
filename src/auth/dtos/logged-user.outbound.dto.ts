import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoggedUserOutboundDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  access_token: string;
}
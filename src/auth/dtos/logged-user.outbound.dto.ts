import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoggedUserOutboundDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}

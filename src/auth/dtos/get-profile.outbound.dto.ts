import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GetProfileOutboundDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  uuid: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  iat: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  exp: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dtos/user-response.dto';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: UserResponseDto;

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}

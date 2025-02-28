import { ApiProperty } from '@nestjs/swagger';

export class PasswordStrengthResponseDto {
  @ApiProperty()
  score: number;

  @ApiProperty()
  feedback: string[];
}

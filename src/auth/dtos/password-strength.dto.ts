import { ApiProperty } from '@nestjs/swagger';

export class PasswordStrengthResponseDto {
  @ApiProperty({ example: 3, description: 'Password strength score (0-4)' })
  score: number;

  @ApiProperty({
    example: ['Add another word or two', 'Avoid repeated words'],
    description: 'Suggestions for improvement',
  })
  feedback: string[];

  @ApiProperty({
    example: {
      crackTimeSeconds: 3600,
      guessesPerSecond: 10000,
    },
    description: 'Detailed strength metrics',
  })
  metrics: {
    crackTimeSeconds: number;
    guessesPerSecond: number;
  };
}

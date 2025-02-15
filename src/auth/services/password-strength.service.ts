import { Injectable } from '@nestjs/common';
import * as zxcvbn from 'zxcvbn';

@Injectable()
export class PasswordStrengthService {
  checkStrength(password: string) {
    const result = zxcvbn(password);

    return {
      score: result.score,
      feedback: [
        ...result.feedback.suggestions,
        result.feedback.warning,
      ].filter(Boolean),
      metrics: {
        crackTimeSeconds: Number(
          result.crack_times_seconds.online_throttling_100_per_hour,
        ),
        guessesPerSecond: 100 / 3600, // Based on throttling rate
      },
    };
  }
}

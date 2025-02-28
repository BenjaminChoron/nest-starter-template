import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CheckPasswordStrengthCommand } from '../check-password-strength.command';
import { PasswordStrengthResponseDto } from '../../dtos/password-strength-response.dto';
import * as zxcvbn from 'zxcvbn';

@CommandHandler(CheckPasswordStrengthCommand)
export class CheckPasswordStrengthHandler
  implements ICommandHandler<CheckPasswordStrengthCommand>
{
  async execute(
    command: CheckPasswordStrengthCommand,
  ): Promise<PasswordStrengthResponseDto> {
    const result = zxcvbn(command.password);

    return {
      score: result.score,
      feedback: result.feedback.suggestions,
    };
  }
}

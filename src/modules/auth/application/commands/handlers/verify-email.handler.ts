import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VerifyEmailCommand } from '../verify-email.command';
import { EmailVerificationService } from '../../../domain/services/email-verification.service';

@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand> {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<void> {
    await this.emailVerificationService.verifyEmail(command.token);
  }
}

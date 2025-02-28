import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SendWelcomeEmailCommand } from '../send-welcome-email.command';
import { EmailService } from 'src/shared/infrastructure/services/email.service';

@CommandHandler(SendWelcomeEmailCommand)
export class SendWelcomeEmailHandler
  implements ICommandHandler<SendWelcomeEmailCommand>
{
  constructor(private readonly emailService: EmailService) {}

  async execute(command: SendWelcomeEmailCommand): Promise<void> {
    await this.emailService.sendWelcomeEmail(command.email);
  }
}

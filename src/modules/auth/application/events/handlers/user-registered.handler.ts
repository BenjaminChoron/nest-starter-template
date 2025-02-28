import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserRegisteredEvent } from '../../../domain/events/user-registered.event';
import { EmailService } from 'src/shared/infrastructure/services/email.service';
import { TokenService } from '../../../domain/services/token.service';

@EventsHandler(UserRegisteredEvent)
export class UserRegisteredHandler
  implements IEventHandler<UserRegisteredEvent>
{
  constructor(
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
  ) {}

  async handle(event: UserRegisteredEvent) {
    const token = await this.tokenService.generateEmailToken({
      sub: event.userId,
      email: event.email,
    });
    await this.emailService.sendVerificationEmail(event.email, token);
  }
}

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ResendVerificationCommand } from '../resend-verification.command';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { TokenService } from '../../../domain/services/token.service';
import { EmailService } from 'src/shared/infrastructure/services/email.service';

@CommandHandler(ResendVerificationCommand)
export class ResendVerificationHandler
  implements ICommandHandler<ResendVerificationCommand>
{
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
  ) {}

  async execute(command: ResendVerificationCommand): Promise<void> {
    const user = await this.userRepository.findById(command.userId);

    if (!user) {
      return;
    }

    const token = await this.tokenService.generateEmailToken({
      sub: user.getId(),
      email: user.getEmail(),
    });

    await this.emailService.sendVerificationEmail(user.getEmail(), token);
  }
}

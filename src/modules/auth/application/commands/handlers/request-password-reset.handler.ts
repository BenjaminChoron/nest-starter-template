import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { RequestPasswordResetCommand } from '../request-password-reset.command';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { TokenService } from '../../../domain/services/token.service';
import { EmailService } from '../../../../../shared/infrastructure/services/email.service';

@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetHandler
  implements ICommandHandler<RequestPasswordResetCommand>
{
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
  ) {}

  async execute(command: RequestPasswordResetCommand): Promise<void> {
    const user = await this.userRepository.findByEmail(command.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.requestPasswordReset();
    const token = await this.tokenService.generateResetToken({
      sub: user.getId(),
      email: user.getEmail(),
    });

    await this.emailService.sendPasswordResetEmail(user.getEmail(), token);
    await this.userRepository.save(user);
  }
}

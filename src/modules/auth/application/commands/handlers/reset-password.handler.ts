import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ResetPasswordCommand } from '../reset-password.command';
import { TokenService } from '../../../domain/services/token.service';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { InvalidTokenException } from '../../../domain/exceptions/invalid-token.exception';
import { PasswordPolicyService } from '../../../domain/services/password-policy.service';

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler
  implements ICommandHandler<ResetPasswordCommand>
{
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly tokenService: TokenService,
    private readonly passwordPolicyService: PasswordPolicyService,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<void> {
    const payload = await this.tokenService.verifyResetToken(command.token);
    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new InvalidTokenException();
    }

    // Check password history and age
    await this.passwordPolicyService.validatePasswordPolicy(
      command.newPassword,
      user.getId(),
      user.getPasswordHistory(),
      user.getLastPasswordChange(),
    );

    await user.updatePassword(command.newPassword);
    await this.userRepository.save(user);
  }
}

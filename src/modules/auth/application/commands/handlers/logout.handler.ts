import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { LogoutCommand } from '../logout.command';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { TokenBlacklistService } from '../../../infrastructure/services/token-blacklist.service';
import { TokenService } from '../../../domain/services/token.service';

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) return;

    const refreshToken = user.getRefreshToken();

    if (refreshToken) {
      await this.tokenBlacklistService.blacklistToken(
        refreshToken,
        this.tokenService.getRefreshTokenTTL(),
      );
    }

    user.clearRefreshToken();
    await this.userRepository.save(user);
  }
}

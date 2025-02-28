import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, UnauthorizedException } from '@nestjs/common';
import { RefreshTokenCommand } from '../refresh-token.command';
import { TokenService } from '../../../domain/services/token.service';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { TokensResponseDto } from '../../dtos/tokens-response.dto';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler
  implements ICommandHandler<RefreshTokenCommand, TokensResponseDto>
{
  constructor(
    private readonly tokenService: TokenService,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<TokensResponseDto> {
    const payload = await this.tokenService.verifyRefreshToken(
      command.refreshToken,
    );
    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.generateAccessToken(user),
      this.tokenService.generateRefreshToken(user),
    ]);

    return { accessToken, refreshToken };
  }
}

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
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<TokensResponseDto> {
    const user = await this.userRepository.findById(command.userId);

    if (!user || user.getRefreshToken() !== command.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new token pair
    const tokens = await this.tokenService.generateTokens(user);

    return tokens;
  }
}

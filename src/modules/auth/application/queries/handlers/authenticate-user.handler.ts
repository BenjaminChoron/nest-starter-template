import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AuthenticateUserQuery } from '../authenticate-user.query';
import { AuthenticationService } from '../../../domain/services/authentication.service';
import { TokenService } from '../../../domain/services/token.service';
import { AuthResponseDto } from 'src/modules/auth/application/dtos/auth-response.dto';
import { UserMapper } from '../../../infrastructure/mappers/user.mapper';

@QueryHandler(AuthenticateUserQuery)
export class AuthenticateUserHandler
  implements IQueryHandler<AuthenticateUserQuery>
{
  constructor(
    private readonly authService: AuthenticationService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(query: AuthenticateUserQuery): Promise<AuthResponseDto> {
    const user = await this.authService.authenticate(
      query.email,
      query.password,
    );
    const accessToken = await this.tokenService.generateAccessToken(user);
    const refreshToken = await this.tokenService.generateRefreshToken(user);

    const dto = UserMapper.toDto(user);
    dto.accessToken = accessToken;
    dto.refreshToken = refreshToken;

    return dto;
  }
}

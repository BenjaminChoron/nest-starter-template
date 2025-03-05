import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticateUserQuery } from 'src/modules/auth/application/queries/authenticate-user.query';
import { RegisterUserCommand } from 'src/modules/auth/application/commands/register-user.command';
import { LoginDto } from 'src/modules/auth/application/dtos/login.dto';
import { RegisterDto } from 'src/modules/auth/application/dtos/register.dto';
import { AuthResponseDto } from 'src/modules/auth/application/dtos/auth-response.dto';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { ResetPasswordCommand } from '../../application/commands/reset-password.command';
import { ResetPasswordDto } from '../../application/dtos/reset-password.dto';
import { RequestPasswordResetDto } from '../../application/dtos/request-password-reset.dto';
import { RequestPasswordResetCommand } from '../../application/commands/request-password-reset.command';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { VerifyEmailCommand } from '../../application/commands/verify-email.command';
import { ResendVerificationCommand } from '../../application/commands/resend-verification.command';
import { VerifyEmailDto } from '../../application/dtos/verify-email.dto';
import { User } from '../../domain/entities/user.entity';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CheckPasswordStrengthDto } from '../../application/dtos/check-password-strength.dto';
import { CheckPasswordStrengthCommand } from '../../application/commands/check-password-strength.command';
import { PasswordStrengthResponseDto } from '../../application/dtos/password-strength-response.dto';
import { JwtRefreshGuard } from '../guards/jwt-refresh.guard';
import { TokensResponseDto } from '../../application/dtos/tokens-response.dto';
import { RefreshTokenCommand } from '../../application/commands/refresh-token.command';
import { LogoutCommand } from '../../application/commands/logout.command';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @Post('login')
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.queryBus.execute(
      new AuthenticateUserQuery(dto.email, dto.password),
    );
  }

  @Public()
  @Post('register')
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.commandBus.execute(
      new RegisterUserCommand(dto.email, dto.password),
    );
  }

  @Public()
  @Post('password-reset/request')
  @ApiResponse({ status: 200 })
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<void> {
    return this.commandBus.execute(new RequestPasswordResetCommand(dto.email));
  }

  @Public()
  @Post('password-reset/reset')
  @ApiResponse({ status: 200 })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    return this.commandBus.execute(
      new ResetPasswordCommand(dto.token, dto.newPassword),
    );
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<void> {
    await this.commandBus.execute(new VerifyEmailCommand(dto.token));
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  async resendVerification(@CurrentUser() user: User): Promise<void> {
    await this.commandBus.execute(new ResendVerificationCommand(user.getId()));
  }

  @Post('password/check-strength')
  @Public()
  @ApiOperation({ summary: 'Check password strength' })
  @ApiResponse({ status: 200, type: PasswordStrengthResponseDto })
  async checkPasswordStrength(
    @Body() dto: CheckPasswordStrengthDto,
  ): Promise<PasswordStrengthResponseDto> {
    return this.commandBus.execute(
      new CheckPasswordStrengthCommand(dto.password),
    );
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 201, type: TokensResponseDto })
  async refresh(@CurrentUser() user: User): Promise<TokensResponseDto> {
    return this.commandBus.execute(
      new RefreshTokenCommand(user.getId(), user.getRefreshToken()),
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200 })
  async logout(@CurrentUser() user: User): Promise<void> {
    await this.commandBus.execute(new LogoutCommand(user.getId()));
  }
}

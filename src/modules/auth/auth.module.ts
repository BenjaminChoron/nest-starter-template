import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Command Handlers
import { CommandHandlers } from './application/commands/handlers';
// Query Handlers
import { QueryHandlers } from './application/queries/handlers';
// Event Handlers
import { EventHandlers } from './application/events/handlers';
// Sagas
import { AuthSagas } from './application/sagas/auth.sagas';
// Infrastructure
import { UserRepository } from './infrastructure/repositories/user.repository';
import { UserOrmEntity } from './infrastructure/entities/user.orm-entity';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { UserMapper } from './infrastructure/mappers/user.mapper';
// Services
import { EmailService } from '../../shared/infrastructure/services/email.service';
// Domain Services
import { AuthenticationService } from './domain/services/authentication.service';
import { EmailVerificationService } from './domain/services/email-verification.service';
import { PasswordPolicyService } from './domain/services/password-policy.service';
import { TokenService } from './domain/services/token.service';
import { CheckPasswordStrengthHandler } from './application/commands/handlers/check-password-strength.handler';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { LocalStrategy } from './infrastructure/strategies/local.strategy';
import { JwtRefreshStrategy } from './infrastructure/strategies/jwt-refresh.strategy';

@Module({
  imports: [
    CqrsModule,
    ConfigModule,
    TypeOrmModule.forFeature([UserOrmEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
    // Sagas
    AuthSagas,
    // Services
    EmailService,
    // Domain Services
    AuthenticationService,
    EmailVerificationService,
    PasswordPolicyService,
    TokenService,
    UserMapper,
    CheckPasswordStrengthHandler,
    JwtStrategy,
    LocalStrategy,
    JwtRefreshStrategy,
  ],
})
export class AuthModule {}

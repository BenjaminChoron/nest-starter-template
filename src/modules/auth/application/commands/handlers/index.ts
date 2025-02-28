import { RegisterUserHandler } from './register-user.handler';
import { VerifyEmailHandler } from './verify-email.handler';
import { SendWelcomeEmailHandler } from './send-welcome-email.handler';
import { RefreshTokenHandler } from './refresh-token.handler';
import { ResetPasswordHandler } from './reset-password.handler';
import { RequestPasswordResetHandler } from './request-password-reset.handler';

export const CommandHandlers = [
  RegisterUserHandler,
  VerifyEmailHandler,
  SendWelcomeEmailHandler,
  RefreshTokenHandler,
  ResetPasswordHandler,
  RequestPasswordResetHandler,
];

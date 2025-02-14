import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${token}`;

    // TODO: Implement actual email sending
    this.logger.debug(`Password Reset Email sent to: ${email}`);
    this.logger.debug(`Reset URL: ${resetUrl}`);
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`;

    // TODO: Implement actual email sending
    this.logger.debug(`Verification Email sent to: ${email}`);
    this.logger.debug(`Verify URL: ${verifyUrl}`);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;
    // TODO: Implement actual email sending
    this.logger.debug(`Sending verification email to ${email}`);
    this.logger.debug(`Verify URL: ${verifyUrl}`);
  }

  async sendWelcomeEmail(email: string): Promise<void> {
    // TODO: Implement actual email sending
    this.logger.debug(`Sending welcome email to ${email}`);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;
    // TODO: Implement actual email sending
    this.logger.debug(`Sending password reset email to ${email}`);
    this.logger.debug(`Reset URL: ${resetUrl}`);
  }
}

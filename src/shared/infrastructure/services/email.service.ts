import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;
    // TODO: Implement actual email sending
    console.log(
      `Sending verification email to ${email} with URL: ${verifyUrl}`,
    );
  }

  async sendWelcomeEmail(email: string): Promise<void> {
    // TODO: Implement actual email sending
    console.log(`Sending welcome email to ${email}`);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;
    // TODO: Implement actual email sending
    console.log(
      `Sending password reset email to ${email} with URL: ${resetUrl}`,
    );
  }
}

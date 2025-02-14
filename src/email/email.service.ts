import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${token}`;

    // TODO: Implement actual email sending
    // For now, just log the reset URL
    console.log('Password Reset Email');
    console.log('To:', email);
    console.log('Reset URL:', resetUrl);
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`;

    // TODO: Implement actual email sending
    console.log('Email Verification');
    console.log('To:', email);
    console.log('Verify URL:', verifyUrl);
  }
}

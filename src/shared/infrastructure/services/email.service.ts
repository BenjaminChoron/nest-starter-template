import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SendGrid from '@sendgrid/mail';

enum MailType {
  VERIFICATION = 'verification',
  PASSWORD_RESET = 'password-reset',
  WELCOME = 'welcome',
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly isDevelopment: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isDevelopment = this.configService.get('NODE_ENV') === 'development';

    if (!this.isDevelopment) {
      SendGrid.setApiKey(this.configService.get('SENDGRID_API_KEY'));
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;

    await this.sendMail(
      {
        to: email,
        from: this.configService.get('SENDGRID_FROM_EMAIL'),
        subject: 'Verify Your Email',
        html: `
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your email:</p>
        <a href="${verifyUrl}">Verify Email</a>
      `,
      },
      MailType.VERIFICATION,
    );
  }

  async sendWelcomeEmail(email: string): Promise<void> {
    await this.sendMail(
      {
        to: email,
        from: this.configService.get('SENDGRID_FROM_EMAIL'),
        subject: `Welcome to ${this.configService.get('APP_NAME')}`,
        html: `
        <h1>Welcome to ${this.configService.get('APP_NAME')}</h1>
        <p>Thank you for signing up!</p>
      `,
      },
      MailType.WELCOME,
    );
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;
    await this.sendMail(
      {
        to: email,
        from: this.configService.get('SENDGRID_FROM_EMAIL'),
        subject: 'Password Reset',
        html: `
        <h1>Password Reset</h1>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
      `,
      },
      MailType.PASSWORD_RESET,
    );
  }

  private async sendMail(
    options: SendGrid.MailDataRequired,
    mailType: MailType,
  ): Promise<void> {
    if (this.isDevelopment) {
      this.logger.debug('Email details in development:');
      this.logger.debug(`Type: ${mailType}`);
      this.logger.debug(
        `To: ${typeof options.to === 'string' ? options.to : JSON.stringify(options.to)}`,
      );
      this.logger.debug(`Subject: ${options.subject}`);
      this.logger.debug(`Content: ${options.html}`);

      return;
    }

    try {
      await SendGrid.send(options);
      this.logger.debug(
        `${mailType} email sent to ${
          typeof options.to === 'string'
            ? options.to
            : JSON.stringify(options.to)
        }`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send ${mailType} email to ${
          typeof options.to === 'string'
            ? options.to
            : JSON.stringify(options.to)
        }`,
        error.stack,
      );

      throw error;
    }
  }
}

import { AggregateRoot } from '@nestjs/cqrs';
import { Email } from '../value-objects/email.value-object';
import { Password } from '../value-objects/password.value-object';
import { UserId } from '../value-objects/user-id.value-object';
import { UserCreatedEvent } from '../events/user-created.event';
import { UserEmailVerifiedEvent } from '../events/user-email-verified.event';
import { PasswordResetRequestedEvent } from '../events/password-reset-requested.event';
import { PasswordResetEvent } from '../events/password-reset.event';

export class User extends AggregateRoot {
  private readonly id: UserId;
  private email: Email;
  private password: Password;
  private isVerified: boolean;
  private passwordHistory: string[] = [];
  private lastPasswordChange?: Date;

  constructor(props: { id: UserId; email: Email; password: Password }) {
    super();
    this.id = props.id;
    this.email = props.email;
    this.password = props.password;
    this.isVerified = false;
    this.apply(new UserCreatedEvent(this.id.getValue()));
  }

  static create(props: { id: UserId; email: Email; password: Password }): User {
    return new User(props);
  }

  verifyEmail(): void {
    if (this.isVerified) {
      throw new Error('Email already verified');
    }

    this.isVerified = true;
    this.apply(new UserEmailVerifiedEvent(this.id.getValue()));
  }

  async validatePassword(password: string): Promise<boolean> {
    return this.password.compare(password);
  }

  getId(): string {
    return this.id.getValue();
  }

  getEmail(): string {
    return this.email.getValue();
  }

  isEmailVerified(): boolean {
    return this.isVerified;
  }

  async updatePassword(newPassword: string): Promise<void> {
    this.password = await Password.create(newPassword);
    this.passwordHistory.push(this.password.getValue());
    this.lastPasswordChange = new Date();
    this.apply(new PasswordResetEvent(this.id.getValue()));
  }

  requestPasswordReset(): void {
    this.apply(
      new PasswordResetRequestedEvent(
        this.id.getValue(),
        this.email.getValue(),
      ),
    );
  }

  getPassword(): string {
    return this.password.getValue();
  }

  getPasswordHistory(): string[] {
    return this.passwordHistory;
  }

  getLastPasswordChange(): Date | undefined {
    return this.lastPasswordChange;
  }
}

import { Injectable } from '@nestjs/common';
import { Password } from '../value-objects/password.value-object';

@Injectable()
export class PasswordPolicyService {
  private readonly HISTORY_SIZE = 5;
  private readonly MIN_AGE_DAYS = 1;
  private readonly MAX_AGE_DAYS = 90;

  async validatePasswordPolicy(
    newPassword: string,
    userId: string,
    previousPasswords: string[],
    lastPasswordChange?: Date,
  ): Promise<void> {
    await this.checkPasswordHistory(newPassword, previousPasswords);
    this.checkPasswordAge(lastPasswordChange);
  }

  private async checkPasswordHistory(
    newPassword: string,
    previousPasswords: string[],
  ): Promise<void> {
    const lastPasswords = previousPasswords.slice(0, this.HISTORY_SIZE);

    for (const oldPassword of lastPasswords) {
      if (await Password.compare(newPassword, oldPassword)) {
        throw new Error('Password was recently used');
      }
    }
  }

  private checkPasswordAge(lastPasswordChange?: Date): void {
    if (!lastPasswordChange) return;

    const daysSinceChange = this.getDaysSince(lastPasswordChange);

    if (daysSinceChange < this.MIN_AGE_DAYS) {
      throw new Error('Password was changed too recently');
    }

    if (daysSinceChange > this.MAX_AGE_DAYS) {
      throw new Error('Password has expired');
    }
  }

  private getDaysSince(date: Date): number {
    const diffTime = Math.abs(Date.now() - date.getTime());

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

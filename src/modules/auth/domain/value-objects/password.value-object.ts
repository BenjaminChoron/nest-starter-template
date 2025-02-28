import { ValueObject } from './value-object.base';
import { InvalidPasswordException } from '../exceptions/invalid-password.exception';
import * as bcrypt from 'bcrypt';

export class Password extends ValueObject<string> {
  private static readonly SALT_ROUNDS = 10;
  private static readonly MIN_LENGTH = 8;

  static async create(password: string): Promise<Password> {
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    return new Password(hashedPassword);
  }

  static fromHashed(hashedPassword: string): Password {
    return new Password(hashedPassword);
  }

  static async compare(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async compare(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.value);
  }

  protected validate(password: string): void {
    if (password.length < Password.MIN_LENGTH) {
      throw new InvalidPasswordException('Password too short');
    }

    if (!password.match(/[A-Z]/)) {
      throw new InvalidPasswordException('Missing uppercase letter');
    }

    if (!password.match(/[a-z]/)) {
      throw new InvalidPasswordException('Missing lowercase letter');
    }

    if (!password.match(/[0-9]/)) {
      throw new InvalidPasswordException('Missing number');
    }

    if (!password.match(/[!@#$%^&*(),.?":{}|<>]/)) {
      throw new InvalidPasswordException('Missing special character');
    }
  }
}

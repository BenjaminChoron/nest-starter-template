import { ValueObject } from './value-object.base';
import { InvalidEmailException } from '../exceptions/invalid-email.exception';

export class Email extends ValueObject<string> {
  protected validate(email: string): void {
    if (!email.match(/^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$/)) {
      throw new InvalidEmailException(email);
    }
  }

  static create(email: string): Email {
    return new Email(email);
  }
}

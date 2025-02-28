import { ValueObject } from './value-object.base';
import { InvalidUserIdException } from '../exceptions/invalid-user-id.exception';

export class UserId extends ValueObject<string> {
  static create(id: string): UserId {
    return new UserId(id);
  }

  protected validate(id: string): void {
    if (
      !id.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      )
    ) {
      throw new InvalidUserIdException(id);
    }
  }
}

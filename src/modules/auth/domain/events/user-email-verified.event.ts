import { IEvent } from '@nestjs/cqrs';

export class UserEmailVerifiedEvent implements IEvent {
  constructor(public readonly userId: string) {}
}

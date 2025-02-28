import { ICommand } from '@nestjs/cqrs';

export class SendWelcomeEmailCommand implements ICommand {
  constructor(public readonly email: string) {}
}

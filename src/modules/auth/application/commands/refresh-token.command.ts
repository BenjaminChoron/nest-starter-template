import { ICommand } from '@nestjs/cqrs';

export class RefreshTokenCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly refreshToken: string,
  ) {}
}

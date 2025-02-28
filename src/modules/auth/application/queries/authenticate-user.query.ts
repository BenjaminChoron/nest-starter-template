import { IQuery } from '@nestjs/cqrs';

export class AuthenticateUserQuery implements IQuery {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}

export class PasswordResetRequestedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}

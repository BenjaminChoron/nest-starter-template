export class EmailAlreadyExistsException extends Error {
  constructor(email: string) {
    super(`Email ${email} is already registered`);
    this.name = 'EmailAlreadyExistsException';
  }
}

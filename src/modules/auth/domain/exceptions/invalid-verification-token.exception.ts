import { UnauthorizedException } from '@nestjs/common';

export class InvalidVerificationTokenException extends UnauthorizedException {
  constructor() {
    super('Invalid verification token');
  }
}

import { UnauthorizedException } from '@nestjs/common';

export class InvalidTokenException extends UnauthorizedException {
  constructor() {
    super('Invalid token');
  }
}

export class TokenRevokedException extends UnauthorizedException {
  constructor() {
    super('Token has been revoked');
  }
}

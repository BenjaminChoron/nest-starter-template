import { UnauthorizedException } from '@nestjs/common';

export class UnverifiedEmailException extends UnauthorizedException {
  constructor() {
    super('Email not verified');
  }
}

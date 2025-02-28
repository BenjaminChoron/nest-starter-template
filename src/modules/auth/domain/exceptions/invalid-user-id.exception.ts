import { BadRequestException } from '@nestjs/common';

export class InvalidUserIdException extends BadRequestException {
  constructor(id: string) {
    super(`Invalid user ID format: ${id}`);
  }
}

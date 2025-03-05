import { Inject, Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { IUserRepository } from '../repositories/user.repository.interface';
import { InvalidCredentialsException } from '../exceptions/invalid-credentials.exception';
import { UnverifiedEmailException } from '../exceptions/unverified-email.exception';

@Injectable()
export class AuthenticationService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async authenticate(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsException();
    }

    if (!user.isEmailVerified()) {
      throw new UnverifiedEmailException();
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    return user;
  }
}

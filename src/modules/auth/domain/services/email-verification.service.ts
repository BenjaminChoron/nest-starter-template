import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../repositories/user.repository.interface';
import { InvalidVerificationTokenException } from '../exceptions/invalid-verification-token.exception';
import { TokenService } from './token.service';

@Injectable()
export class EmailVerificationService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly tokenService: TokenService,
  ) {}

  async verifyEmail(token: string): Promise<void> {
    const payload = await this.tokenService.verifyEmailToken(token);
    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new InvalidVerificationTokenException();
    }

    user.verifyEmail();
    await this.userRepository.save(user);
  }
}

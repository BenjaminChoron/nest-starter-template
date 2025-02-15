import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordHistoryService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async addToHistory(userId: string, password: string): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) return;

    // Keep last 5 passwords
    const MAX_HISTORY = 5;
    const hashedPassword = await bcrypt.hash(password, 10);

    user.previousPasswords = user.previousPasswords || [];
    user.previousPasswords.unshift(hashedPassword);
    user.previousPasswords = user.previousPasswords.slice(0, MAX_HISTORY);
    user.lastPasswordChange = new Date();

    await this.userRepository.save(user);
  }

  async isPasswordReused(
    userId: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user?.previousPasswords?.length) return false;

    // Check against previous passwords
    const matches = await Promise.all(
      user.previousPasswords.map(async hash => {
        return bcrypt.compare(newPassword, hash);
      }),
    );

    return matches.includes(true);
  }
}

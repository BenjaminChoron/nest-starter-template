import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
  ) {}

  create(email: string, password: string) {
    const uuid = uuidv4();
    const user = this.repo.create({ uuid, email, password });

    return this.repo.save(user);
  }

  findByUuid(uuid: string) {
    if (!uuid) {
      return null;
    }
    return this.repo.findOneBy({ uuid });
  }

  findByEmail(email: string) {
    return this.repo.findOneBy({ email });
  }
}

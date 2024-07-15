import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from './user.entity';
import { ImagesService } from '../utils/images.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
    private imagesService: ImagesService,
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
    if (!email) {
      return null;
    }
    return this.repo.findOneBy({ email });
  }

  async update(uuid: string, attrs: Partial<User>) {
    const user = await this.findByUuid(uuid);

    if (!user) {
      throw new NotFoundException(`User with uuid ${uuid} not found`);
    }

    if (attrs.avatar) {
      const { secure_url } = await this.imagesService.upload(attrs.avatar);
      attrs.avatar = secure_url;
    }

    Object.assign(user, attrs);

    return this.repo.save(user);
  }

  async remove(uuid: string) {
    const user = await this.findByUuid(uuid);

    if (!user) {
      throw new NotFoundException(`User with uuid ${uuid} not found`);
    }

    return this.repo.remove(user);
  }
}

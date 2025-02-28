import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { Password } from '../../domain/value-objects/password.value-object';
import { UserId } from '../../domain/value-objects/user-id.value-object';
import { AuthResponseDto } from 'src/modules/auth/application/dtos/auth-response.dto';

@Injectable()
export class UserMapper {
  static async toDomain(ormEntity: UserOrmEntity): Promise<User> {
    const user = User.create({
      id: UserId.create(ormEntity.id),
      email: Email.create(ormEntity.email),
      password: Password.fromHashed(ormEntity.password),
    });

    if (ormEntity.isEmailVerified) {
      user.verifyEmail();
    }

    return user;
  }

  static toOrm(domainEntity: User): UserOrmEntity {
    const orm = new UserOrmEntity();
    orm.id = domainEntity.getId();
    orm.email = domainEntity.getEmail();
    orm.password = domainEntity.getPassword();
    orm.isEmailVerified = domainEntity.isEmailVerified();

    return orm;
  }

  static toDto(user: User): AuthResponseDto {
    const userDto = {
      id: user.getId(),
      email: user.getEmail(),
      isEmailVerified: user.isEmailVerified(),
    };

    return {
      ...userDto,
      accessToken: '', // Will be set by auth service
      refreshToken: '', // Will be set by auth service
    };
  }
}

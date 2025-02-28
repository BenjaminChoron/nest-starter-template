import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetUserProfileQuery } from '../get-user-profile.query';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserMapper } from '../../../infrastructure/mappers/user.mapper';
import { AuthResponseDto } from '../../../application/dtos/auth-response.dto';

@QueryHandler(GetUserProfileQuery)
export class GetUserProfileHandler
  implements IQueryHandler<GetUserProfileQuery, AuthResponseDto>
{
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: GetUserProfileQuery): Promise<AuthResponseDto> {
    const user = await this.userRepository.findById(query.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return UserMapper.toDto(user);
  }
}

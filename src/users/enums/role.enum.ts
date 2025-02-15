import { ApiProperty } from '@nestjs/swagger';

export enum Role {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export class RoleEnum {
  @ApiProperty({
    enum: Role,
    example: Role.USER,
    description: 'User role (user, admin, super_admin)',
  })
  role: Role;
}

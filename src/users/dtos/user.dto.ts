import { Expose } from 'class-transformer';

export class UserDto {
  @Expose()
  uuid: string;

  @Expose()
  email: string;
}

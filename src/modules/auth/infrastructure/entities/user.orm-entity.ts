import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Role } from '../../../../users/enums/role.enum';

@Entity('users')
export class UserOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'email_verification_token', nullable: true })
  emailVerificationToken?: string;

  @Column({ name: 'refresh_token', nullable: true })
  refreshToken?: string;

  @Column('text', { array: true, name: 'password_history', default: [] })
  passwordHistory: string[];

  @Column({ name: 'last_password_change', type: 'timestamp', nullable: true })
  lastPasswordChange?: Date;
}

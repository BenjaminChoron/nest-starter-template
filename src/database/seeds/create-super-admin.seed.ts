import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { UserOrmEntity } from '../../modules/auth/infrastructure/entities/user.orm-entity';
import { Role } from '../../users/enums/role.enum';
import * as bcrypt from 'bcrypt';

export default class CreateSuperAdminSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(UserOrmEntity);

    // Check if super admin exists
    const superAdminExists = await repository.findOneBy({
      email: 'admin@example.com',
      role: Role.SUPER_ADMIN,
    });

    if (!superAdminExists) {
      const user = repository.create({
        id: crypto.randomUUID(),
        email: 'admin@example.com',
        password: await bcrypt.hash('Admin123!@#', 10),
        role: Role.SUPER_ADMIN,
        isEmailVerified: true,
      });

      await repository.save(user);
    }
  }
}

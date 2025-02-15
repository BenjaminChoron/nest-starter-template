import { AppDataSource } from '../data-source';
import CreateSuperAdminSeeder from './create-super-admin.seed';

async function main() {
  try {
    await AppDataSource.initialize();
    const seeder = new CreateSuperAdminSeeder();
    await seeder.run(AppDataSource);
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

void main();

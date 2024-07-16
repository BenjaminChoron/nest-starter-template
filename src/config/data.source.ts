import { DataSource, DataSourceOptions } from 'typeorm';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const isTestEnv = process.env.NODE_ENV === 'test';

export const dbdatasource: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: isTestEnv
    ? parseInt(process.env.TEST_DATABASE_PORT, 10)
    : parseInt(process.env.DATABASE_PORT, 10),
  database: isTestEnv
    ? process.env.TEST_DATABASE_NAME
    : process.env.DATABASE_NAME,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  synchronize: false,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
};

const dataSource = new DataSource(dbdatasource);
export default dataSource;

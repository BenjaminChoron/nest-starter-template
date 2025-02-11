import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

const getEnvVar = (prod: string, test: string): string =>
  process.env.NODE_ENV === 'test' ? process.env[test] : process.env[prod];

export const dbdatasource: DataSourceOptions = {
  type: 'postgres',
  host: getEnvVar('DATABASE_HOST', 'TEST_DATABASE_HOST'),
  port: parseInt(getEnvVar('DATABASE_PORT', 'TEST_DATABASE_PORT'), 10),
  database: getEnvVar('DATABASE_NAME', 'TEST_DATABASE_NAME'),
  username: getEnvVar('DATABASE_USER', 'TEST_DATABASE_USER'),
  password: getEnvVar('DATABASE_PASSWORD', 'TEST_DATABASE_PASSWORD'),
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false,
        }
      : false,
};

const dataSource = new DataSource(dbdatasource);
export default dataSource;

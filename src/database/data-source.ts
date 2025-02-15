import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';
import { config } from 'dotenv';
import { join } from 'path';

config();

const getEnvVar = (prod: string, test: string): string =>
  process.env.NODE_ENV === 'test' ? process.env[test] : process.env[prod];

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export const dataSourceOptions: DataSourceOptions & SeederOptions = {
  type: 'postgres',
  host: getEnvVar('DATABASE_HOST', 'TEST_DATABASE_HOST'),
  port: parseInt(getEnvVar('DATABASE_PORT', 'TEST_DATABASE_PORT'), 10),
  database: getEnvVar('DATABASE_NAME', 'TEST_DATABASE_NAME'),
  username: getEnvVar('DATABASE_USER', 'TEST_DATABASE_USER'),
  password: getEnvVar('DATABASE_PASSWORD', 'TEST_DATABASE_PASSWORD'),
  synchronize: false,
  logging: isDevelopment,
  logger: isDevelopment ? 'advanced-console' : 'simple-console',
  maxQueryExecutionTime: isDevelopment ? 1000 : 2000, // Log slow queries
  entities: [join(__dirname, '../**/*.entity.{ts,js}')],
  migrations: [join(__dirname, './migrations/*.{ts,js}')],
  migrationsTableName: 'migrations',
  ssl: isProduction
    ? {
        rejectUnauthorized: false,
      }
    : false,
  cache: isProduction
    ? {
        type: 'ioredis',
        duration: 60000, // 1 minute
      }
    : false,
  extra: {
    max: 20, // Connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  seeds: ['dist/database/seeds/*.seed.js'],
};

export const AppDataSource = new DataSource(dataSourceOptions);

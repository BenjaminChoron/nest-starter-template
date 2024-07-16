import { DataSource, DataSourceOptions } from 'typeorm';
require('dotenv').config();

export const dbdatasource: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10),
  database: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  synchronize: false,
  entities: ['dist/**/*entity.js'],
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
};

const dataSource = new DataSource(dbdatasource);
export default dataSource;

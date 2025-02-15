import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('NestJS API')
  .setDescription('REST API documentation')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('auth', 'Authentication endpoints')
  .addTag('users', 'User management endpoints')
  .addServer('http://localhost:3000', 'Local development')
  .addServer('https://api.example.com', 'Production')
  .build();

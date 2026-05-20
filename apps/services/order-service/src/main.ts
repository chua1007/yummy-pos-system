import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { OrderModule } from './order.module';

async function bootstrap() {
  const app = await NestFactory.create(OrderModule);
  const logger = new Logger('OrderService');

  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 4001;
  await app.listen(port);
  logger.log(`🛒 Order Service running on port ${port}`);
}

bootstrap();

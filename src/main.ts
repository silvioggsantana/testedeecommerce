import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.enableCors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' });  // Restrinja em prod
  app.use(helmet());  // Headers de segurança (CSP, HSTS, etc.)
  app.use(compression());  // Gzip para respostas
  await app.listen(process.env.PORT || 3000);
  console.log(`App rodando em ${process.env.NODE_ENV} na porta ${process.env.PORT}`);
}
bootstrap();
import { ConfigService } from '@/core/config/config.service';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import compression from '@fastify/compress';
import fastifyCookie from '@fastify/cookie';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '../errors/all-exceptions.filter';

export async function configureApp(app: NestFastifyApplication) {
  const config = app.get(ConfigService);

  await app.register(compression);
  await app.register(fastifyCookie, {
    secret: config.get('COOKIE_SECRET'),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: config
      .get('CORS_ALLOWED_ORIGINS')
      .split(',')
      .map((s) => s.trim()),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
}

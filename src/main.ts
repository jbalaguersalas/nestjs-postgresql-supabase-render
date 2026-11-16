import { existsSync } from 'node:fs';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { requestLogger } from './common/request-logger';

// En tu ordenador, lee el .env. En Render no hay .env: las variables las pone Render.
if (existsSync('.env')) process.loadEnvFile();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // En Render las peticiones llegan a través de un proxy:
  // así Express ve la IP de verdad de cada cliente (1 = hay un proxy delante)
  app.set('trust proxy', 1);

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1', // la ruta que no diga nada es v1
  });

  app.use(helmet()); // cabeceras de seguridad en todas las respuestas
  app.use(requestLogger); // una línea en la consola por cada petición

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Todos los errores con la misma forma
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({ origin: `http://127.0.0.1:${process.env.WEB_PORT}` });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

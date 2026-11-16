import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BooksModule } from './books/books.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 20 }], // 20 peticiones cada 60 segundos
      errorMessage: 'Demasiadas peticiones. Espera un poco.',
    }),
    BooksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Activa el límite en TODAS las rutas
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

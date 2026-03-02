import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedditModule } from './modules/reddit/reddit.module';
import { TrustpilotModule } from './modules/trustpilot/trustpilot.module';
import { THROTTLE_PROFILES } from './constants/throttle.constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV ?? 'development'}`,
    }),
    ThrottlerModule.forRoot([
      // Limite par défaut — toutes les routes non annotées
      { name: 'default', ...THROTTLE_PROFILES.default },
      // Authentification — brute force protection
      { name: 'auth', ...THROTTLE_PROFILES.auth },
      // Scraping — Chromium + API Reddit sont coûteux
      { name: 'scraping', ...THROTTLE_PROFILES.scraping },
    ]),
    PrismaModule,
    UserModule,
    AuthModule,
    RedditModule,
    TrustpilotModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }, AppService],
  controllers: [AppController],
})
export class AppModule {}

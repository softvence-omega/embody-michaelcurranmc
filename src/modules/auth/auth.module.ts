import { Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EmailService } from '../verify/verify.service';



@Module({
  imports: [
    AuthModule,
    PrismaModule,
    PassportModule, 
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EmailService],
  exports: [AuthService],
})
export class AuthModule {}


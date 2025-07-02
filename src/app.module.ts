
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import * as dotenv from 'dotenv';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport'; 
import { AuthModule } from './modules/auth/auth.module'; 
import { UsersModule } from './modules/users/users.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MulterModule } from '@nestjs/platform-express';
import { PostModule } from './modules/posts/post.module';
import { CommonModule } from './common/common.module';
import { EmailService } from './modules/verify/verify.service';

dotenv.config();

@Module({
  imports: [ 
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MulterModule.register({
      dest: './uploads',
    }),

    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    PrismaModule,
    AuthModule, 
    UsersModule,
    CloudinaryModule,
    PostModule,
    CommonModule,

  ],
  controllers: [AppController],
  providers: [AppService, EmailService],
  exports:[EmailService]
})
export class AppModule {}




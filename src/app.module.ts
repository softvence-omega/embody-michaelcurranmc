
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

dotenv.config();

@Module({
  imports: [ 
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    PrismaModule,
    AuthModule, 
    UsersModule,
    CloudinaryModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}




// import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';

// import * as dotenv from 'dotenv';
// import { PrismaModule } from './prisma/prisma.module';
// import { PrismaService } from './prisma/prisma.service';
// import { ConfigModule } from '@nestjs/config';
// import { JwtModule } from '@nestjs/jwt';

// dotenv.config();
// @Module({
//   imports: [ 
//     JwtModule.register({
//       secret: process.env.JWT_SECRET,
//       signOptions: {expiresIn: '1h'},
//     }),
//     ConfigModule.forRoot({
//       isGlobal: true,
//     }),
//     PrismaModule
//   ],
//   controllers: [AppController],
//   providers: [AppService, PrismaService],
// })
// export class AppModule {}

import { Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from 'src/prisma/prisma.module';



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
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}


// @Module({
//     imports: [
//         ConfigModule.forRoot({
//             isGlobal: true,
//         }),
//         PassportModule,
//         JwtModule.register({
//             secret: process.env.JWT_SECRET,
//             signOptions: { expiresIn: process.env.JWT_EXPIRATION_IN || '1h' },
//             //inject: [ConfigService],
//             // useFactory: async (config: ConfigService) => ({
//             //     secret: process.env.JWT_SECRET || config.get<string>('JWT_SECRET'),
//             //     signOptions: { expiresIn: process.env.JWT_EXPIRATION_IN || config.get<string>('JWT_EXPIRATION_IN') || '1h' },
                    
//             // }),
//         }),
//     ],
//     controllers: [AuthController],
//     providers: [AuthService, JwtService, JwtStrategy],
//     exports: [AuthService, JwtModule]
// })

// export class AuthModule {}
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ref } from 'process';
import { create } from 'domain';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from '../../../generated/prisma/index';
import { access } from 'fs';

interface User {
  id: string;
  email: string;
  password: string;
  displayName?: string | null;
  role: 'user' | 'admin';
  createdAt?: Date;
}
interface SignupInput {
  email: string;
  password: string;
  displayName?: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger();
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup({
    email,
    password,
    displayName,
    role = 'user',
  }: SignupInput & { role?: 'user' | 'admin' }) {
    try {
      if (!email || !password) {
        throw new BadRequestException('Email and password are required');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new UnauthorizedException('Invalid email format');
      }
      if (password.length < 8) {
        throw new BadRequestException(
          'Password must be at least 8 characters long',
        );
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: displayName || email, // Provide a value for 'name'
          displayName,
          role,
        },
      });
      console.log('User created:', user);
      const token = this.generateToken(user);

      return {
        message: 'User created successfully',
        ...token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
      };
    } catch (err) {
      console.log('Signup error:', err);
      if (
        err instanceof BadRequestException ||
        err instanceof UnauthorizedException
      ) {
        throw err;
      }
      throw new BadRequestException('Failed to create user');
    }
  }

  async signin(email: string, password: string) {
    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // Removed isLoggedIn check as user object does not have this property
    const isMatchPassword = await bcrypt.compare(password, user.password);
    if (!isMatchPassword) {
      throw new UnauthorizedException('Credentials are incorrect');
    }

    console.log('User signed in:', user);
    const token = this.generateToken(user);
    return {
      message: 'Login Successfull',
      ...token,
      refreshToken: await this.generateRefreshToken(user),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: new Date().toISOString(),
      },
    };
  }



  private generateToken(user: User) {
    const secret = this.configService.get<string>('JWT_SECRET');
    if(!secret) {
      throw new Error(" JWT_SECRET is not defined");
    }
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iss: 'my-app',
      aud: 'my-app-users',
    };
    console.log("Generating token payload:" , payload);
    try{

      const token = this.jwtService.sign(payload, {
        secret,
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
      });
      return {
      access_token: token,
    };

    } catch(err) {
      console.error("Token Generation error:" , err);
      throw new UnauthorizedException('Failed to generate token');
    }


    
  }

  async generateRefreshToken(user: User) {
    try {
      const payload = { sub: user.id, type: 'refresh' };
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: '7d',
      });

      // Store refresh token in DB (with hash for security)
      await this.prisma.refreshToken.upsert({
        where: { userId: user.id },
        create: {
          token: await bcrypt.hash(refreshToken, 10),
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
        update: {
          token: await bcrypt.hash(refreshToken, 10),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      return refreshToken;
    } catch (err) {
      this.logger.error('Failed to save refresh token', err);
      throw new InternalServerErrorException('Token generation failed');
    }
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
      if(!secret) {
        throw new Error('JWT_REFRESH_SECRET is not defined');
      }
      const payload = this.jwtService.verify(refreshToken, {secret});
      console.log('Refresh token payload:', payload);

      const storedToken =await this.prisma.refreshToken.findFirst({
        where: {
          userId: payload.sub, expiresAt: {
            gt: new Date()
          }
        }
      });
      if(!storedToken || !(await bcrypt.compare(refreshToken, storedToken.token))) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: {id: payload.sub},
      });
      if(!user) {
        throw new UnauthorizedException('User not found');
      }

      const newAccessToken = this.generateToken(user).access_token;
      const newRefreshToken = await this.generateRefreshToken(user);

      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id},
      });
      console.log('Refresh token deleted:', storedToken.id);
      
      return {
        access_token: newAccessToken,
        refreshToken: newRefreshToken,
      }
    } catch(err){
      this.logger.error('Refresh token Error:', err);
      throw new UnauthorizedException("Invalid refresh token")
    }
  }

  // //refreshtoken endpoint
  // async refreshAccessToken(refreshToken: string) {
  //   try {
  //     const payload = this.jwtService.verify(refreshToken);

  //     const storedToken = await this.prisma.refreshToken.findFirst({
  //       where: { userId: payload.sub, expiresAt: { gt: new Date() } },
  //     });
  //     if (
  //       !storedToken ||
  //       !(await bcrypt.compare(refreshToken, storedToken.token))
  //     ) {
  //       throw new UnauthorizedException('Invalid refresh token');
  //     }
  //     const user = await this.prisma.user.findUnique({
  //       where: { id: payload.sub },
  //     });
  //     if (!user) {
  //       throw new UnauthorizedException('User not found');
  //     }
  //     await this.prisma.refreshToken.delete({
  //       where: { id: storedToken.id },
  //     });
  //     console.log('Refresh token deleted:', storedToken.id);
  //     return {
  //       access_token: this.generateToken(user).access_token,
  //       RefreshToken: await this.generateRefreshToken(user),
  //     };
  //   } catch (error) {
  //     throw new UnauthorizedException('Invalid refresh token');
  //   }
  // }
}

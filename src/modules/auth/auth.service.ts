import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ref } from 'process';


interface User {
  id: string;
  email: string;
  password: string;
  displayName?: string | null;
  role: 'user' | 'admin';
}
interface SignupInput {
  email: string;
  password: string;
  displayName?: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup({
    email,
    password,
    displayName,
    role = 'user',
  }: SignupInput & { role?: 'user' | 'admin' }) {
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
        name: user.displayName,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      }
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
    const isMatchPassword = await bcrypt.compare(password, user.password);
    if (!isMatchPassword) {
      throw new UnauthorizedException('Password is incorrect');
    }
    console.log('User signed in:', user);
    const token =  this.generateToken(user);
    return {
      message: 'Login Successfull',
      ...token,
      refreshToken: await this.generateRefreshToken(user),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      }
    }
  }

  private generateToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
       iss: 'my-app',
       aud: 'my-app-users',
   
    };
    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: '60m',
      }),
    };
  }
  

async generateRefreshToken(user: User) {
    const payload = { sub: user.id, type: 'refresh' };
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d', 
    });

    // Store refresh token in DB (with hash for security)
    await this.prisma.refreshToken.create({
      data: {
        token: await bcrypt.hash(refreshToken, 10),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return refreshToken;
  }


  //refreshtoken endpoint
  async refreshAccessToken(refreshToken: string) {
    try {
        const payload = this.jwtService.verify(refreshToken);
        
        const storedToken = await this.prisma.refreshToken.findFirst({
            where: {userId: payload.sub, expiresAt: { gt: new Date() }},
        })
        if(!storedToken || !(await bcrypt.compare(refreshToken, storedToken.token))){
            throw new UnauthorizedException('Invalid refresh token');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });
        if(!user) {
            throw new UnauthorizedException('User not found');
        }
        await this.prisma.refreshToken.delete({
            where: { id: storedToken.id }})
        console.log('Refresh token deleted:', storedToken.id);
          return {
              access_token: this.generateToken(user).access_token,
              RefreshToken: await this.generateRefreshToken(user),
              
          }
        
      
          
          
  } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
  }
}
 

}

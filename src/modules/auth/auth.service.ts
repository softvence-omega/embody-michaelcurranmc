import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

// import { LoginDto } from './dto/login.dto'; // Uncomment and use if needed
// import { User } from '@prisma/client';
import { RefreshToken } from '../../../generated/prisma/index';
import { access } from 'fs';

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
      throw new UnauthorizedException('Email and password are required');
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
    return this.generateToken(user);
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
    return this.generateToken(user);
  }

  private generateToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iss: 'project-name',
      aud: 'embody-api',
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
      expiresIn: '7d', // Long-lived refresh token
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
  async refreshAccessToken(RefreshToken: string) {
    try {
        const payload = this.jwtService.verify(RefreshToken);
        
        const storedToken = await this.prisma.refreshToken.findFirst({
            where: {userId: payload.sub, expiresAt: { gt: new Date() }},
        })
        if(!storedToken || !(await bcrypt.compare(RefreshToken, storedToken.token))){
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

            return {
                access_token: this.generateToken(user).access_token,
                RefreshToken: await this.generateRefreshToken(user)
            }
    } catch (error) {
        throw new UnauthorizedException('Invalid refresh token');
    }
  }
}

//================old api ==================

// @Injectable()
// export class AuthService {
//     constructor(private prisma: PrismaService, private jwtService: JwtService) {}
//     async singupUser(email: string, password: string, displayName?: string) {
//         const hashed =  await bcrypt.hash(password, 10);
//         const user = await this.prisma.user.create({
//             data: {
//                 email,
//                 password: hashed,
//                 displayName,
//                 role: 'user'
//             }
//         });
//         return this.generateToken(user);
//     }

//     async signupAdmin(email: string, password: string, displayname?: string) {
//         const hashed = await bcrypt.hash(password, 10);
//         const user = await this.prisma.user.create({
//             data: {
//                 email,
//                 password: hashed,
//                 displayName: displayname,
//                 role: 'admin'
//             }
//         });
//         return this.generateToken(user);
//     }

//     async signinUser(email: string, password: string) {
//         const user = await this.prisma.user.findUnique({
//             where: {email}
//         })
//         if(!user) {
//             throw new UnauthorizedException('User is not found');
//         }
//         const isMatch = await bcrypt.compare(password, user.password);
//         if(!isMatch) {
//             throw new UnauthorizedException("Password is not corrent");
//         }
//         return this.generateToken(user);
//     }
//     async signinAdmin(email: string, password: string) {
//         const admin = await this.prisma.admin.findUnique({
//             where: { email }
//         });
//         if (!admin) {
//             throw new UnauthorizedException('admin email is not matched');
//         }
//         const isMatch = await bcrypt.compare(password, admin.password);
//         if (!isMatch) {
//             throw new UnauthorizedException("Password is not correct");
//         }
//         return this.generateToken(admin);
//     }

//     private generateToken(user: any) {
//         const payload = { sub: user.id, email: user.email, role: user.role };
//         return {
//             access_token: this.jwtService.sign(payload),
//         };
//     }
// }

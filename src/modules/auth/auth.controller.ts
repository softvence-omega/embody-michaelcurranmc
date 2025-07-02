import { Body, Controller, HttpCode, HttpStatus, Post, Res, Req,Get,Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';
import { RefreshTokenDto } from './dto/refreshToken.dto';

// import { RefreshDto } from './dto/authResponse.dto';


@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'User Successflly logged in' })
  async signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Access token successfully refreshed',
  })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(dto.refresh_token);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token');
    return { message: 'Logout successful' };
  }
  @Public()
  @Get('verify-email/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({summary: 'Verify user email'})
  @ApiResponse({status:200, description:"Email verified successfully"})
  @ApiResponse({status: 400, description: "Invalid or expired verification token"})
  async verifyEmail(@Param('token') token: string) {
    return this.authService.verifyEmail(token)
  }
}


// @Controller('auth')
// export class AuthController {
//   constructor(private authService: AuthService) {}

//   @Post('signup')
//   signup(@Body() dto: SignupDto) {
//     return this.authService.signup(dto);
//   }

//   @Post('signin')
//   signin(@Body() dto: SigninDto) {
//     return this.authService.signin(dto.email, dto.password);
//   }
//   @Post('refresh-token')
//     async refreshToken(@Body('refreshToken') refresh_token: string) {
//         return this.authService.refreshAccessToken(refresh_token);

//     }
// }


//======can handle the refresh token logic as well======
// @ApiTags('auth')
// @Controller('auth')
// export class AuthController {
//   constructor(private readonly AuthService: AuthService) {}

//   @Public()
//   @Post('signup')
//   @HttpCode(HttpStatus.CREATED)
//   @ApiOperation({ summary: 'Register a new user' })
//   @ApiResponse({ status: 201, description: 'User successfully registered' })
//   async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) res: Response) {
//     const user = await this.AuthService.signup(dto);
//     const accessToken = this.AuthService.generateToken(user); // assuming you have this method
//     const refreshToken =  this.AuthService.generateToken(user);

//     res.cookie('refresh_token', refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     });

//     return { user, access_token: accessToken };
//   }

//   @Public()
//   @Post('signin')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: 'User login' })
//   async signin(@Body() dto: SigninDto, @Res({ passthrough: true }) res: Response) {
//     const user = await this.AuthService.signin(dto.email, dto.password);
//     const accessToken =  this.AuthService.generateToken(user); // assuming you have this method
//     const refreshToken =  this.AuthService.generateToken(user);

//     res.cookie('refresh_token', refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     return { user, access_token: accessToken };
//   }

//   @Public()
//   @Post('refresh')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: 'Refresh access token' })
//   @ApiResponse({ status: 200, description: 'Access token successfully refreshed' })
//   async refresh(@Req() req: Request) {
//     const token = req.cookies['refresh_token'];
//     return this.AuthService.refreshAccessToken(token);
//   }

//   @Public()
//   @Post('logout')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: 'Logout' })
//   @ApiResponse({ status: 200, description: 'Logged out successfully' })
//   async logout(@Res({ passthrough: true }) res: Response) {
//     res.clearCookie('refresh_token');
//     return { message: 'Logout successful' };
//   }
// }




// import { Controller, Post, Body } from "@nestjs/common";
// import { AuthService } from './auth.service';
// import { SignupDto } from './dto/signup.dto';
// import { SigninDto } from "./dto/signin.dto";

// @Controller('auth')
// export class AuthController {
//     constructor(private readonly authService: AuthService) {}

//     @Post('signup')
//     async signup(@Body() dto: SignupDto) {
//         return this.authService.signup(dto);
//     }
//     @Post('signin')
//     async login(@Body() dto: SigninDto){
//         return this.authService.signin(dto.email, dto.password);
//     }
//     @Post('refresh-token')
//     async refreshToken(@Body('refreshToken') refresh_token: string) {
//         return this.authService.refreshAccessToken(refresh_token);

//     }
// }

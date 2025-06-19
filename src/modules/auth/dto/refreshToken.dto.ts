import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'your_refresh_token_here',
    description: 'The refresh token to get a new access token',
  })
  @IsString()
  refresh_token: string;
}
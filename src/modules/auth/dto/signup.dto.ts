
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength,IsOptional,IsEnum } from 'class-validator';



export enum Role {
  user = 'user',
  admin = 'admin'
}

export class SignupDto {
  @ApiProperty({example: "Arman"})
  @IsString()
  name?: string;
  
  @ApiProperty({example: 'mdarman@gmail.com'})
  @IsEmail()
  email: string;

  @ApiProperty({example: 'password123'})
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({example: 'Arman'})
  @IsString()
  displayName?: string;
 
  @ApiPropertyOptional({enum: Role, example: Role.user})
  @IsOptional()
  @IsEnum(Role)
  role?: Role = Role.user;

}


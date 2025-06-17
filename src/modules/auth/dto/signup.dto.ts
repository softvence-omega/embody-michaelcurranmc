
import { IsString, IsEmail, MinLength,IsOptional,IsEnum } from 'class-validator';
import { registerDecorator, ValidationOptions } from 'class-validator';

export enum Role {
  user = 'user',
  admin = 'admin'
}

export class CreateCatDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  displayName?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role = Role.user;

}


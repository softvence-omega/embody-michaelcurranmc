import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';


export class SigninDto {

    @ApiProperty({
        example: 'mdarman@gmail.com',
        description: 'Registered email address of the user',
        required: true,
    })

    @IsEmail()
    email:string;

    @ApiProperty({
        example: 'password123',
        description: 'Password for the user account',
        required:true,
        })

        
    @IsString()
    password: string;
    
}
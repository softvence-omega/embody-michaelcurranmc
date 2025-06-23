import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from 'class-validator';


export class GetUserResponseDto {

    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Unique identifier of the user' })
    id: string;

    @ApiProperty({ example: 'user@example.com', description: 'Email address of the user' })
    @IsEmail()
    email: string;
    
    @ApiProperty({example: 'John Doe'})
    @IsString()
    name: string;

    @ApiProperty({ example: '@Doe57', description: 'Display name of the user' })
    displayName?: string | null;

    @ApiProperty({ example: 'user', description: 'Role of the user, e.g., user or admin' })
    role: 'user' | 'admin';

     @ApiProperty({ example: '2023-10-01T12:00:00Z', description: 'Timestamp when the user was created' })
     createdAt: Date;

}
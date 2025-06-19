import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";


export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Access Token',
  })
  @IsString()
  access_token: string;


}
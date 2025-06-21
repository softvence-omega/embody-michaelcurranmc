import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';



export class CreatePostDto{
    @ApiProperty({ description: 'Title of the post' , example: 'My First Post' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ description: 'Post content', required: false, example: 'This is the content of my first post' })
    @IsOptional()
    @IsString()
    content?: string;

    @ApiProperty({description: 'Post caption', required: false, example: 'This is a caption for the post'})
    @IsOptional()
    @IsString()
    caption?: string;

    @ApiProperty({ description: 'Is post public?', default: true, required: false })
    @IsOptional()
    @IsBoolean()
    is_public?: boolean;

    @ApiProperty({ description: 'Is post featured?', default: false, required: false})
    @IsOptional()
    @IsBoolean()
    is_featured?: boolean;

    @ApiProperty({ description: 'Post image URL', required: false, example: 'https://example.com/image.jpg' })
    @IsOptional()
    @IsString()
    image_url?: string;

    @ApiProperty({ description: 'Post video URL', required: false, example: 'https://example.com/video.mp4' })
    @IsOptional()
    @IsString()
    video_url?: string;



}
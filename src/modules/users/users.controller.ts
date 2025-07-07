import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Delete,
  Request,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { GetUserResponseDto } from './dto/get-user-response.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User found successfully',
    type: GetUserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<GetUserResponseDto> {
    const user = await this.usersService.findById(id);
    return {
      ...user,
      name: user.name ?? '',
      displayName: user.displayName ?? '',
      userImageUrl: (user as any).userImageUrl ?? '',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Post(':id/follow')
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({ name: 'id', description: 'ID of user to follow' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successfully followed user',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Already following this user',
  })
  async folloUser(
    @Request() req: Express.Request,
    @Param('id') followingId: string,
  ) {
    const followerId = (req.user as any)?.id;
    if (!followerId || !followingId) {
      throw new BadRequestException('Cannot follow youself');
    }

    await this.usersService.followUser(followerId, followingId);

    return {
      statusCose: HttpStatus.CREATED,
      message: 'User followed successfully',
      data: { followerId, followingId },
    };
  }

  @Delete(':id/unfollow')
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({ name: 'id', description: 'ID of user to unfollow' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully unfollowed user',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request',
  })
  async unfollowUser(
    @Request() req: Express.Request,
    @Param('id') followingId: string,
  ) {
    const followerId = (req.user as any)?.id;
    if (!followerId || followingId) {
      throw new BadRequestException('Both ID required');
    }
    await this.usersService.unfollowUser(followerId, followingId);
    return {
      statusCode: HttpStatus.OK,
      message: 'User unfollowed successfully',
      data: { followerId, followingId },
    };
  }

  @Get(':id/followers')
  @ApiOperation({summary: 'Get a user followers'})
  @ApiParam({name: 'id', description: 'User ID'})
  @ApiResponse({status: HttpStatus.OK, description:' List of followers'})
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found'})
   async getFollowers(
    @Param('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
   ){
    if(page<1 || limit< 1 || limit > 100) {
      throw new BadRequestException('Page limited')
    }
    const result = await this.usersService.getFollewers(userId, page, limit);
    return {
      statusCode: HttpStatus.OK,
      data: result.data,
      meta: result.meta
    }
   }

   @Get(':id/following')
   @ApiOperation({summary: 'Get users a user is following'})
   @ApiResponse({status: HttpStatus.OK, description: 'List of followed users'})
   @ApiResponse({status: HttpStatus.NOT_FOUND, description: 'User not Found'})

   async getFollowing(
    @Param('id') userId: string,
    @Query('page') page: number= 1,
    @Query('limit') limit: number=10
   ){
    if(page< 1 || limit <1 || limit> 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }
    const result = await this.usersService.getFollowing(userId, page, limit);
    return {
      statusCode: HttpStatus.OK,
      data: result.data,
      meta: result.meta
    }
   }
}

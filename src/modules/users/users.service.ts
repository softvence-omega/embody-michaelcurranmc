import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { create } from 'domain';
import { tr } from '@faker-js/faker/.';
import { ErrorHandlerService } from 'src/error/error-handler.service';
import { error } from 'console';

@Injectable()
export class UsersService {

    constructor(private readonly prisma: PrismaService, 
        
    ) {}


    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if(!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            displayName: user.displayName || null,
            role: user.role,
        };
    }

    async getAllUsers() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                displayName: true,
                role: true,
                is_premium: true,
                posts: true,
                last_login_at: true,
                createdAt: true,    
                updatedAt: true,
            }
        })
    }

    async followUser(followerId: string, followingId: string) {

        if(followerId === followingId){
            throw new BadRequestException('Cannot follow your self');
        }

        return this.prisma.$transaction(async (prisma) => {

            const [ follower, following] = await Promise.all([
                prisma.user.findUnique({ 
                    where: {
                        id: followerId
                    },
                    select: { id: true}
                }),
                prisma.user.findUnique({ 
                    where: {
                        id: followingId
                    },
                    select: {
                        id: true
                    }
                })
            ]);

            if(!follower || !following) {
                throw new NotFoundException('One or both users not found');
            }

            const existingFollow = await prisma.userFollow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId, followingId
                    },                   
                },
                select: {id: true}
            });

            if(existingFollow) {
                throw new ConflictException('Already following this user');
            }

            return prisma.userFollow.create({
                data: { followerId, followingId},
                select: { id: true, followerId: true, followingId: true, created_at: true}
            });

        }).catch((err) => {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === 'P2002') { 
                    throw new ConflictException('Already following this user');
                }
                if (err.code === 'P2025') { 
                    throw new NotFoundException('User not found');
                }
            }
            throw err;
        });
    }

    async unfollowUser(followerId: string, followingId: string) {
        
        return this.prisma.$transaction(async (prisma) => {
            const follow = await prisma.userFollow.findUnique({
                where: { followerId_followingId: { followerId, followingId}},
                select: { id: true}
            });
             if(!follow) {
                throw new NotFoundException(' Follow relationship not found');
             }
              return prisma.userFollow.delete({
                where: { id: follow.id},
                select: { id: true, followerId: true, followingId: true}
              });
        });
    }

    async getFollewers(userId: string, page: number=1, limit: number= 10) {
         if(page< 1 || limit <1 || limit > 100) {
            throw new BadRequestException('Invalid pagination parameters');
         }
         const [ user, followers] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: userId},
                select: { id: true}
            }),
            this.prisma.userFollow.findMany({
                where: { followingId: userId},
                skip: (page-1)*limit,
                take: limit,
                include: {
                    follower: {
                        select: {
                            id: true,
                            email: true,
                            displayName: true,
                            userImageUrl: true
                        }
                    }
                },
                orderBy: {created_at:'desc'}
            })
         ]);

         if(!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
         }
         return {
            data: followers.map(f => f.follower),
            meta: {
                page,
                limit,
                total: await this.prisma.userFollow.count({
                    where: {
                        followingId: userId
                    }
                })
            }
         }
    }
    async getFollowing(userId: string, page:number =1, limit: number= 10) {

        if(page< 1 || limit< 1 || limit > 100) {
            throw new BadRequestException('Invalid pagination parameters');
        }
        const [user, following] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: userId},
                select:{ id: true}
            }),
            this.prisma.userFollow.findMany({
                where: { followerId: userId},
                skip: (page-1)* limit,
                take: limit,
                include: {
                    following: {
                        select:{
                            id: true,
                            email: true,
                            displayName: true,
                            userImageUrl: true
                        }
                    }
                },
                orderBy: { created_at: 'desc'}
            })
        ]);
        if(!user) {
            throw new NotFoundException(`User with ID ${userId} not Found`);
        }
        return {
            data: following.map(f => f.following),
            meta: {
                page,
                limit,
                total: await this.prisma.userFollow.count({where: { followerId: userId}})
            }
        }

    }
}

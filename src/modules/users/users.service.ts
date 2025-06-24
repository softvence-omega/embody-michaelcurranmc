import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { create } from 'domain';
import { tr } from '@faker-js/faker/.';

@Injectable()
export class UsersService {

    constructor(private readonly prisma: PrismaService) {}

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
}

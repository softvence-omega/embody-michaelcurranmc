import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { faker } from '@faker-js/faker';
import { User } from 'src/modules/schemas/users/user.schema';


@Injectable()
export class SeederService {
    constructor(
        @InjectModel('User') private userModel: Model<User>,

    ) {}
}
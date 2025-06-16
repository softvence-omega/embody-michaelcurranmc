
import { Prop, Schema } from "@nestjs/mongoose";


@Schema()
export class User {
    @Prop({requierd: true, unique: true}) email: string;
    @Prop() display_name: string;
    @Prop() password_hash: string;
    @Prop() profile_picture_url: string;
    @Prop() bio: string;
    @Prop({default: false}) privacy_mode: boolean;
    @Prop() created_at: Date;
    @Prop() updated_at: Date; 
}

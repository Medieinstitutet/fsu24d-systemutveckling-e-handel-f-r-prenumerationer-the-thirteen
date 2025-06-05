import { Schema, model, models } from 'mongoose';
import type { AccessLevel } from '@/types/access';

export interface IContent {
    title: string; 
    body: string; 
    accessLevel: AccessLevel;
    imageUrl: string; 
    createdAt: Date; 
}

const ContentSchema = new Schema<IContent>({
    title: { type: String, required: true }, 
    body: { type: String, required: true },
    accessLevel: {
        type: String, 
        enum: ['basic', 'pro', 'premium'], 
        default: 'basic',
    },
    imageUrl: { type: String, required: false},
    createdAt: { type: Date, default: Date.now }, 
}); 

export default models.Content || model<IContent>('Content', ContentSchema);
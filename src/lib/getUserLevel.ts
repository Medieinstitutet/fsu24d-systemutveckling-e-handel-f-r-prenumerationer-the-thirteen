
import type { AccessLevel } from '@/types/access'; 

export async function getUserLevel(): Promise<AccessLevel> {
   
    return 'basic';
}
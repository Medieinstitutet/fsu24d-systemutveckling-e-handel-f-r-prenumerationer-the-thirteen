export type AccessLevel = 'free' | 'basic' | 'pro' | 'premium';

export const ACCESS_ORDER: Record<AccessLevel, number> = {
    free: 0,
    basic: 1, 
    pro: 2,
    premium: 3,
};

export function hasAccess(
    userLevel: AccessLevel, 
    articleLevel: AccessLevel

) {
    return ACCESS_ORDER[userLevel] >= ACCESS_ORDER[articleLevel];
}
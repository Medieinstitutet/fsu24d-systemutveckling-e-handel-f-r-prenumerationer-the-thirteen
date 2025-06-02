export type AccessLevel = 'basic' | 'pro' | 'premium';

export const Access_ORDER: Record<AccessLevel, number> = {
    basic: 0, 
    pro: 1,
    premium: 2,
};

export function hasAccess(
    userLevel: AccessLevel, 
    articleLevel: AccessLevel

) {
    return ACCESS_ORDER[userLevel] >= ACCESS_ORDER[articleLevel];
}
import { hasAccess } from '@/types/access';
import type { AccessLevel } from '@/types/access';

type Props = {
    title: string; 
    body: string; 
    articleLevel: AccessLevel; 
    userLevel: AccessLevel; 
}; 

export default function ArticleCard({
    title, 
    body, 
    articleLevel, 
    userLevel, 
   }: Props) {
    const allowed = hasAccess(userLevel, articleLevel); 

    return (
        <article className="border rounded-xl p-4 space-y-2 shadow">
            <h2 className="text-xl font-semibold">{title}</h2>

            {allowed ? (
                <p>{body}</p>
            ) : (
                <p className="italix text-gray-500">
                    Innehållet kräver {articleLevel.toUpperCase()}-nivå.
                </p>
            )}
        </article>
    )
}
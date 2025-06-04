import Link from 'next/link';
import type { AccessLevel } from '@/types/access';
import { hasAccess } from '@/types/access';

type Props = {
    _id: string;
    title: string; 
    body: string; 
    articleLevel: AccessLevel; 
    userLevel: AccessLevel; 
}; 

export default function ArticleCard({
    _id,
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
                <p>{body.slice(0, 120)}</p>
            ) : (
                <p className="italic text-gray-500">
                    Innehållet kräver {articleLevel.toUpperCase()}-nivå.
                </p>
            )}

            <Link href={`/articles/${_id}`} className="inline-block mt-2 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">
            Läs artikel
            </Link>
        </article>
    )
}
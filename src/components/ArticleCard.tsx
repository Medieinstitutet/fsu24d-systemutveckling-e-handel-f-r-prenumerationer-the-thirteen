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

            <span className={`
            inline-block rounded px-2 text-xs mb-1
            ${articleLevel === 'premium' && 'bg-blue-100 text-yellow-800'}
            ${articleLevel === 'pro' && 'bg-blue-100 text-blue-800'}
            ${articleLevel === 'basic' && 'bg-blue-100 text-gray-800'}
            ${articleLevel === 'free' && 'bg-blue-100 text-green-800'}
            `}
            >
                {articleLevel.toUpperCase()}
            </span>

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
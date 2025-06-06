import UpgradeNotice from '@/components/UpgradeNotice';
import { hasAccess } from '@/types/access';
import { getUserLevel } from '@/lib/getUserLevel';
import type { AccessLevel } from '@/types/access';

type Article = {
    _id: string; 
    title: string; 
    body: string; 
    accessLevel: AccessLevel;
}

async function fetchArticle(id: string): Promise<Article | null> {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/articles/${id}`,
        { cache: 'no-store' }
    );
    if (!res.ok) return null; 
    return res.json(); 
}

export default async function ArticlePage({
    params, 
}: {
    params: { id: string }; 
}) {
    const article = await fetchArticle(params.id); 
    if (!article) return <p>Artikeln hittades inte</p>

    const userLevel = await getUserLevel();
    const allowed = hasAccess(userLevel, article.accessLevel);

    return (
        <main className="mx-auto max-w-3xl lg:max-w-4xl px-4 lg:px-0 py-10 space-y-8">

            <header className="space-y-3 text-center">
            <h1 className="text-3xl font-bold">{article.title}</h1>
            </header>

            {!allowed && <UpgradeNotice userLevel={userLevel} />}

            <article className={`
            prose prose-neutral 
            lg:prose-lg
            max-w-none 
            ${!allowed && `blur-sm select none`}
            `}>


            {allowed ? (
                <article className="prose">{article.body}</article>
            ) : (
                <p className="italic text-gray-500">
                    Den här artikeln kräver {article.accessLevel.toUpperCase()}-nivå för att läsa.
                    </p>
                
            )}
            </article>
        </main>
    )
}
    
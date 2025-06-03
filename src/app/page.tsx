
import ArticleCard from '@/app/components/ArticleCard'; 
import UpgradeNotice from '@/app/components/UpgradeNotice'; 
import { hasAccess } from '@/types/access';
import { AccessLevel } from '@/types/access';
import { getUserLevel } from '@/lib/getUserLevel';

type Article = {
  _id: string; 
  title: string; 
  body: string; 
  accessLevel: AccessLevel; 
}


async function fetchArticles(level: AccessLevel): Promise<Article[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/articles?level=${level}`,
    { cache: 'no-store' }
  ); 
  return res.json(); 
}

export default async function Home() {

  // Hämta användarens prenumerationsnivå
  const userLevel = await getUserLevel(); 
  
  const articles = await fetchArticles(userLevel);

  const hasLocked = articles.some(
    (a) => !hasAccess(userLevel, a.accessLevel)
  ); 

  return (
    <main className="max-w-2xl mx-auto space-y-6 py-8">
      <h1 className="text-3xl font-bold">Artiklar</h1>

      {hasLocked && <UpgradeNotice />}

      <div className="space-y-4">
        {articles.map((a) => (
          <ArticleCard
          key={a._id}
          title={a.title}
          body={a.body}
          articleLevel={a.accessLevel}
          userLevel={userLevel}
          />
        ))}
      </div>
    </main>
  )
}
import ArticleCard from '@/components/ArticleCard'; 
import UpgradeNotice from '@/components/UpgradeNotice'; 
import { hasAccess } from '@/types/access';
import { AccessLevel } from '@/types/access';
import { getUserLevel } from '@/lib/getUserLevel';





const ACCESS_ORDER: Record<AccessLevel, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  premium: 3,
};

type Article = {
  _id: string; 
  title: string; 
  body: string; 
  accessLevel: AccessLevel; 
}


async function fetchArticles(): Promise<Article[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/articles`,
    { cache: 'no-store' }
  ); 
  return res.json(); 
}

export default async function Home() {

  // Hämta användarens prenumerationsnivå
  const userLevel = await getUserLevel(); 
  
  const articles = await fetchArticles();

  articles.sort(
    (a, b) => ACCESS_ORDER[a.accessLevel] - ACCESS_ORDER[b.accessLevel]
  ); 

  const hasLocked = articles.some(
    (a) => !hasAccess(userLevel, a.accessLevel)
  ); 

  return (

    <main className="max-w-2xl mx-auto space-y-6 py-8">
      <h1 className="text-3xl font-bold">D13 Nyhetsbrev</h1>
      
      

      <span 
      className={`
        inline-block rounded-full px-3 py-1 text-xs
        ${userLevel === 'premium' && 'bg-yellow-100 text-yellow-800'}
        ${userLevel === 'pro' && 'bg-blue-100 text-blue-800'}
        ${userLevel === 'basic' && 'bg-green-100 text-green-800'}
        ${userLevel === 'free' && 'bg-gray-100 text-gray-800'}`}>
          Ditt paket: {userLevel.toUpperCase()}
        </span>

      {hasLocked && <UpgradeNotice userLevel={userLevel} />}

      <div className="space-y-4">
        {articles.map((a) => (
          <ArticleCard
          key={a._id}
          _id={a._id}
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
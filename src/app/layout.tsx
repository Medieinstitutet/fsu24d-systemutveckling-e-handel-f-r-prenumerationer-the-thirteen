import SessionProviderWrapper from "../components/SessionProviderWrapper";
import './globals.css';
import LogoutButton from "@/components/LogoutButton";
import { getUserLevel } from "@/lib/getUserLevel";
import { AccessLevel } from "@/types/access";
import Link from "next/link";


export default async function RootLayout({ children }: { children: React.ReactNode }) {


const userLevel = await getUserLevel(); 

const badgeClass = {
  free: 'bg-green-100 text-green-800',
  basic: 'bg-blue-100 text-gray-800',
  pro: 'bg-blue-100 text-blue-800',
  premium: 'bg-yellow-100 text-yellow-800',
}[userLevel as AccessLevel]


  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>
          <header className="sticky top-0 z-30 bg-white border-b">
            <nav className="max-w-7xl mx-auto flex items-center justify-between p-4">
              <Link href="/" className="text-lg font-bold">
              <p>D13 Nyhetsbrev</p>
              </Link>
              <div className="flex items-center gap-4 text-sm">
                <span className={`rounded-full px-3 py-1 text-xs ${badgeClass}`}>
                  {userLevel.toUpperCase()}
                </span>

                {userLevel !== 'premium' && (
                  <Link href="/subscriptions" className="rounded bg-blue-600 px-3 py-1 hover:bg-blue-700">
                    <p className="text-white">Uppgradera</p>
                  </Link>
                )}
                
                <div className="relative group">
                  <button className="flex items-center gap-1 px-3 py-1 rounded hover:bg-gray-100">
                    <span>Profil</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>
                  
                  <div className="absolute right-0 hidden pt-2 group-hover:block z-40">
                    <div className="bg-white shadow-lg rounded border py-1 w-40">
                      <Link href="/account" className="block px-4 py-2 hover:bg-gray-100">
                        Mitt konto
                      </Link>
                      <div className="px-4 py-2 hover:bg-gray-100">
                        <LogoutButton />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </nav>
          </header>
          {children}
            </SessionProviderWrapper>
          </body>
        </html>
  ); 
}

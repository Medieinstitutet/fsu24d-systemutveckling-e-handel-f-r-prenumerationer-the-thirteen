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
              D13 Nyhetsbrev
              </Link>
              <div className="flex items-center gap-4 text-sm">
                <span className={`rounded-full px-3 py-1 text-xs ${badgeClass}`}>
                  {userLevel.toUpperCase()}
                </span>

                {userLevel !== 'premium' && (
                  <Link href="/subscriptions" className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700">
                    Uppgradera
                  </Link>
                )}
                <LogoutButton />
              </div>
            </nav>
          </header>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
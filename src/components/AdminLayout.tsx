'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout ({ children }: { children: React.ReactNode }) {

  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

return <>
<div className="flex min-h-screen">
  <nav className="w-64 bg-black p-4 space-y-2">
    <Link href="/admin" className={`block p-2 rounded ${
      isActive('/admin') ? 'bg-gray-100 text-black' : 'text-white hover:bg-gray-800 hover:text-white'
    }`}>➕ New article</Link>
  </nav>
  <main className="flex-1 p-6 bg-white">{ children }</main>
</div>
</>
}
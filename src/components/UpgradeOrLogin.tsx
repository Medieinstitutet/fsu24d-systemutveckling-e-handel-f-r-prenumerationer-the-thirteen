'use client'; 

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function UpgradeOrLogin() {
    const { data: session } = useSession(); 
    const loggedIn = !!session; 

    return loggedIn ? (
        <Link 
        href="/subscriptions"
        className="rounded bg-blue-600 px-3 py-1 hover:bg-blue-700 text-white"
        >
            <p>Uppgradera</p>
        </Link>
    ) : (
        <Link 
        href="/login"
        className="underline text-gray-600 hover:text-black text-xs"
        >
            Logga in
        </Link>
    )
}
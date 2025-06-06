'use client';

import { signOut } from "next-auth/react";

export default function LogoutButton () {
    return (
        <button onClick={() => signOut()} className="underline text-gray-600 hover:text-black">
            Logga ut
        </button>
    )
}
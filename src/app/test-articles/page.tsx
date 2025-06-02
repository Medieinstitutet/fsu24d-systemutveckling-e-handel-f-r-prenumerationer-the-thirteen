'use client'; 

import { useEffect, useState } from 'react'; 
import type { AccessLevel } from '@/types/access';

type Article = {
    _id: string; 
    title: string; 
    accessLevel: AccessLevel;
}; 

export default function TestArticles() {
    const [data, setData] = useState<Article[]>([]);

    useEffect(() => {
        fetch('/api/articles')
        .then((res) => res.json())
        .then(setData)
        .catch(console.error); 
    }, []); 

    return (
        <div className="p-8 space-y-2">
            <h1 className="text-2xl font-bold">Testlista</h1>

            {data.length === 0 && <p>Inga artiklar hittades</p>}

            <ul className="list-disc pl-5">
                {data.map((a) => (
                    <li key={a._id}>
                        {a.title} ({a.accessLevel})
                    </li>
                ))}
            </ul>
        </div>
    )
}
type AccessLevel = 'free' | 'basic' | 'pro' | 'premium';

export default function UpgradeNotice({ userLevel }: {userLevel: AccessLevel}) {
    const text = userLevel === 'free'
    ? 'Välj ett abonnemang för att låsa upp fler artiklar'
    : 'Du saknar rätt nivå för att läsa allt innehåll.'; 

    return (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-xl">
            <p>{text}{' '} 
            <a href="/subcriptions" className="underline">
            Uppgradera här</a></p>
        </div>
    )
}


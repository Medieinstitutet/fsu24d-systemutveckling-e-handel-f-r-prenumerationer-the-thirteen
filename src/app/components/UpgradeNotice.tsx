
export default function UpgradeNotice() {
    return (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-xl">
            <p>
                Du saknar rätt nivå.{" "}
                <a href="/subscriptions" className="underline font-medium hover:text-yellow-800">
                Uppgradera här
                </a>
            </p>
        </div>
    )
}
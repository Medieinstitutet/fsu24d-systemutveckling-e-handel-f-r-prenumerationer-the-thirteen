"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getSubscriptionStatus } from "@/services/stripe-service";

export default function SuccessPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!session?.user?.email) return;

      try {
        await getSubscriptionStatus();
        
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      } catch (error) {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [session]);

  return (
    <div className="max-w-md mx-auto mt-20 text-center p-6 border rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">
        Tack för din prenumeration! 🎉
      </h1>
      <p className="text-gray-700 mb-4">
        Din betalning har genomförts och ditt konto uppdateras inom kort.
      </p>
      {isLoading ? (
        <p className="text-blue-600">Uppdaterar din prenumeration...</p>
      ) : (
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => router.push("/account")}
        >
          Gå till mitt konto
        </button>
      )}
    </div>
  );
}

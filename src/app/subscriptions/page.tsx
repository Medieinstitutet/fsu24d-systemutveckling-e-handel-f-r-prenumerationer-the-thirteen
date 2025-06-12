"use client";

import { useSession } from "next-auth/react";
import { startSubscription } from "@/services/stripe-service";
import { useRouter } from "next/navigation";

import { subscriptionLevels } from "@/lib/data";

import SubscriptionCard from "@/components/SubscriptionCard";

export default function SubscriptionCards() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSubscribe = async (level: string) => {
    if (!session?.user?.email) {
      router.push("/login");
      return;
    }

    const url = await startSubscription(session.user.email, level);
    window.location.href = url;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
      {subscriptionLevels.map(({ title, description, perks, image }) => (
        <SubscriptionCard
          key={title}
          image={image}
          title={title}
          description={description}
          perks={perks}
          onClick={() => handleSubscribe(title)}
        />
      ))}
    </div>
  );
}

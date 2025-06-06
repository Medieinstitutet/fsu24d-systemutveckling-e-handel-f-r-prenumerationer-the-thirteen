"use client";

import { useSession } from "next-auth/react";
import { startSubscription } from "@/services/stripe-service";

import { levels } from "@/lib/data";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

const SubscriptionCards = () => {
  const { data: session } = useSession();
  console.log("SESSION", session);

  const handleSubscribe = async (level: string) => {
    if (!session?.user?.email) return alert("Du måste vara inloggad");

    const url = await startSubscription(session.user.email, level);
    window.location.href = url;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
      {levels.map(({ title, description, perks }) => (
        <Card key={title} className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {perks.map((perk) => (
                <li key={perk}>✅ {perk}</li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button onClick={() => handleSubscribe(title)}>Prenumerera</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default SubscriptionCards;

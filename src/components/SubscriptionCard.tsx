import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Image from "next/image";

type CardProps = {
  title: string;
  description: string;
  perks: string[];
  image: string;
  onClick: () => void;
};

export default function SubscriptionCard({
  title,
  description,
  perks,
  image,
  onClick,
}: CardProps) {
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="flex flex-col items-center gap-4">
        <div className="w-24 h-24 relative">
          <Image src={image} alt={title} fill className="object-contain" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-1 text-sm">
          {perks.map((perk) => (
            <li key={perk}>✅ {perk}</li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button className="w-full" onClick={onClick}>
          Prenumerera
        </Button>
      </CardFooter>
    </Card>
  );
}

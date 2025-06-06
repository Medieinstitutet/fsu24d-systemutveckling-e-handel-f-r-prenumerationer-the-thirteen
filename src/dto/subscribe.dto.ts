import { User } from "@/types/user";

export interface SubscribeDTO {
  email: string;
  level: User["subscriptionLevel"];
}

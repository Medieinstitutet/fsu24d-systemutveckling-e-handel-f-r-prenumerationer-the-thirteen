import axios from "axios";

export const startSubscription = async (email: string, level: string) => {
  const res = await axios.post("/api/stripe/subscribe", { email, level });
  return res.data.url;
};

import axios from "axios";

axios.defaults.withCredentials = true;

export const startSubscription = async (email: string, level: string) => {
  const res = await axios.post("/api/stripe/subscribe", { email, level });
  return res.data.url;
};

export const cancelSubscription = async () => {
  try {
    const res = await axios.post("/api/subscription/cancel");
    return res.data;
  } catch (error: any) {
    console.error("Fel vid avslutning av prenumeration:", error.response?.data || error.message);
    throw error;
  }
};

export const getSubscriptionStatus = async () => {
  try {
    const res = await axios.get("/api/subscription/status");
    return res.data;
  } catch (error: any) {
    console.error("Fel vid hämtning av prenumerationsstatus:", error.response?.data || error.message);
    throw error;
  }
};

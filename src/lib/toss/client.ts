import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { publicEnv } from "@/lib/env";

export async function loadPayment(customerKey: string) {
  const tossPayments = await loadTossPayments(publicEnv.NEXT_PUBLIC_TOSS_CLIENT_KEY);
  return tossPayments.payment({ customerKey });
}

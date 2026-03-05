import apiClient from './client';
import type {
  CoinBalance,
  CoinPackage,
  PurchaseCoinsRequest,
  PurchaseCoinsResponse,
  SpendCoinsRequest,
  SpendCoinsResponse,
} from './types';

/** Get current coin balance. */
export async function getCoinBalance(): Promise<CoinBalance> {
  const { data } = await apiClient.get<CoinBalance>('/coins/balance');
  return data;
}

/** Get available coin packages for purchase. */
export async function getCoinPackages(): Promise<CoinPackage[]> {
  const { data } = await apiClient.get<CoinPackage[]>('/coins/packages');
  return data;
}

/** Purchase a coin package. */
export async function purchaseCoins(
  body: PurchaseCoinsRequest,
): Promise<PurchaseCoinsResponse> {
  const { data } = await apiClient.post<PurchaseCoinsResponse>('/coins/purchase', body);
  return data;
}

/** Spend coins to unlock an episode. */
export async function spendCoins(body: SpendCoinsRequest): Promise<SpendCoinsResponse> {
  const { data } = await apiClient.post<SpendCoinsResponse>('/coins/spend', body);
  return data;
}

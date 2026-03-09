import api from './client';
import type {
  BalanceResponse,
  CoinPackageResponse,
  TransactionResponse,
  UnlockResponse,
  PaginatedResponse,
} from '../types/api';

/** Get current coin balance for the subscriber. */
export async function getBalance(): Promise<BalanceResponse> {
  const {data} = await api.get<BalanceResponse>('/coins/balance');
  return data;
}

/** List available coin packages for purchase. */
export async function listPackages(): Promise<CoinPackageResponse[]> {
  const {data} = await api.get<CoinPackageResponse[]>('/coins/packages');
  return data;
}

/** Purchase a coin package (stubbed — credits coins without payment). */
export async function purchasePackage(
  packageId: string,
): Promise<TransactionResponse> {
  const {data} = await api.post<TransactionResponse>('/coins/purchase', {
    package_id: packageId,
  });
  return data;
}

/** Spend coins to unlock an episode. */
export async function spendCoins(
  episodeId: string,
): Promise<UnlockResponse> {
  const {data} = await api.post<UnlockResponse>('/coins/spend', {
    episode_id: episodeId,
  });
  return data;
}

/** List coin transactions with pagination. */
export async function listTransactions(
  offset = 0,
  limit = 20,
): Promise<PaginatedResponse<TransactionResponse>> {
  const {data} = await api.get<PaginatedResponse<TransactionResponse>>(
    '/coins/transactions',
    {params: {offset, limit}},
  );
  return data;
}

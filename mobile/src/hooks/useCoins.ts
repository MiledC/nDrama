import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {
  getBalance,
  listPackages,
  purchasePackage,
  spendCoins,
  listTransactions,
} from '../api/coins';
import type {
  BalanceResponse,
  CoinPackageResponse,
  TransactionResponse,
  UnlockResponse,
  PaginatedResponse,
} from '../types/api';

/** Hook to fetch the subscriber's current coin balance. */
export function useBalance() {
  return useQuery<BalanceResponse, Error>({
    queryKey: ['coins', 'balance'],
    queryFn: getBalance,
  });
}

/** Hook to fetch available coin packages. */
export function usePackages() {
  return useQuery<CoinPackageResponse[], Error>({
    queryKey: ['coins', 'packages'],
    queryFn: listPackages,
  });
}

/** Mutation to purchase a coin package with optimistic balance update. */
export function usePurchaseMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    TransactionResponse,
    Error,
    {packageId: string; coinAmount: number},
    {previous: BalanceResponse | undefined}
  >({
    mutationFn: ({packageId}) => purchasePackage(packageId),
    onMutate: async ({coinAmount}) => {
      await queryClient.cancelQueries({queryKey: ['coins', 'balance']});
      const previous = queryClient.getQueryData<BalanceResponse>(['coins', 'balance']);
      if (previous) {
        queryClient.setQueryData<BalanceResponse>(['coins', 'balance'], {
          balance: previous.balance + coinAmount,
        });
      }
      return {previous};
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['coins', 'balance'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['coins', 'balance']});
      queryClient.invalidateQueries({queryKey: ['coins', 'transactions']});
    },
  });
}

/** Mutation to spend coins to unlock an episode. */
export function useSpendMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    UnlockResponse,
    Error,
    {episodeId: string; cost: number},
    {previous: BalanceResponse | undefined}
  >({
    mutationFn: ({episodeId}) => spendCoins(episodeId),
    onMutate: async ({cost}) => {
      await queryClient.cancelQueries({queryKey: ['coins', 'balance']});
      const previous = queryClient.getQueryData<BalanceResponse>(['coins', 'balance']);
      if (previous) {
        queryClient.setQueryData<BalanceResponse>(['coins', 'balance'], {
          balance: previous.balance - cost,
        });
      }
      return {previous};
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['coins', 'balance'], context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({queryKey: ['coins', 'balance']});
      queryClient.invalidateQueries({queryKey: ['coins', 'transactions']});
      queryClient.invalidateQueries({queryKey: ['episodes', 'detail', variables.episodeId]});
    },
  });
}

/** Hook to fetch coin transaction history. */
export function useTransactions(offset = 0, limit = 20) {
  return useQuery<PaginatedResponse<TransactionResponse>, Error>({
    queryKey: ['coins', 'transactions', offset, limit],
    queryFn: () => listTransactions(offset, limit),
  });
}

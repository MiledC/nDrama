import { useCallback } from "react";
import { useCoinStore } from "../stores/coinStore";

export function useCoinBalance() {
  const { balance, spendCoins, addCoins } = useCoinStore();

  const canAfford = useCallback(
    (cost: number) => balance >= cost,
    [balance]
  );

  return {
    balance,
    canAfford,
    spendCoins,
    addCoins,
  };
}

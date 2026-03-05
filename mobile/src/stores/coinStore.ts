import { create } from "zustand";

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price_usd: number;
  bonus_coins: number;
  is_popular: boolean;
  store_product_id: string;
}

interface CoinState {
  balance: number;
  packages: CoinPackage[];
  isLoadingBalance: boolean;
  isLoadingPackages: boolean;

  setBalance: (balance: number) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  setPackages: (packages: CoinPackage[]) => void;
  setIsLoadingBalance: (loading: boolean) => void;
  setIsLoadingPackages: (loading: boolean) => void;
}

export const useCoinStore = create<CoinState>((set, get) => ({
  balance: 0,
  packages: [],
  isLoadingBalance: false,
  isLoadingPackages: false,

  setBalance: (balance) => set({ balance }),

  addCoins: (amount) => {
    set((state) => ({ balance: state.balance + amount }));
  },

  spendCoins: (amount) => {
    const { balance } = get();
    if (balance < amount) return false;
    set({ balance: balance - amount });
    return true;
  },

  setPackages: (packages) => set({ packages }),
  setIsLoadingBalance: (loading) => set({ isLoadingBalance: loading }),
  setIsLoadingPackages: (loading) => set({ isLoadingPackages: loading }),
}));

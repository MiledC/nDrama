import { useCoinStore } from "@/stores/coinStore";

const resetStore = () => useCoinStore.setState(useCoinStore.getInitialState());

beforeEach(() => resetStore());

describe("coinStore", () => {
  it("starts with zero balance", () => {
    expect(useCoinStore.getState().balance).toBe(0);
  });

  it("setBalance sets the balance", () => {
    useCoinStore.getState().setBalance(100);
    expect(useCoinStore.getState().balance).toBe(100);
  });

  it("addCoins increases balance", () => {
    useCoinStore.getState().setBalance(50);
    useCoinStore.getState().addCoins(30);
    expect(useCoinStore.getState().balance).toBe(80);
  });

  it("spendCoins decreases balance and returns true", () => {
    useCoinStore.getState().setBalance(100);
    const result = useCoinStore.getState().spendCoins(40);
    expect(result).toBe(true);
    expect(useCoinStore.getState().balance).toBe(60);
  });

  it("spendCoins returns false when insufficient balance", () => {
    useCoinStore.getState().setBalance(10);
    const result = useCoinStore.getState().spendCoins(20);
    expect(result).toBe(false);
    expect(useCoinStore.getState().balance).toBe(10);
  });

  it("spendCoins allows spending exact balance", () => {
    useCoinStore.getState().setBalance(50);
    const result = useCoinStore.getState().spendCoins(50);
    expect(result).toBe(true);
    expect(useCoinStore.getState().balance).toBe(0);
  });

  it("setPackages stores coin packages", () => {
    const packages = [
      {
        id: "pkg1",
        name: "Starter",
        coins: 100,
        price_usd: 0.99,
        bonus_coins: 0,
        is_popular: false,
        store_product_id: "com.draama.coins.100",
      },
    ];
    useCoinStore.getState().setPackages(packages);
    expect(useCoinStore.getState().packages).toEqual(packages);
  });

  it("setIsLoadingBalance updates loading state", () => {
    useCoinStore.getState().setIsLoadingBalance(true);
    expect(useCoinStore.getState().isLoadingBalance).toBe(true);
    useCoinStore.getState().setIsLoadingBalance(false);
    expect(useCoinStore.getState().isLoadingBalance).toBe(false);
  });
});

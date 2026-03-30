import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  image?: string;
  slug: string;
  maxStock?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => boolean;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => boolean;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = "tshirt-kella-cart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem): boolean => {
    const existing = items.find((i) => i.variantId === item.variantId);
    const currentQty = existing ? existing.quantity : 0;
    const maxStock = item.maxStock ?? Infinity;
    if (currentQty + item.quantity > maxStock) {
      return false; // stock exceeded
    }
    setItems((prev) => {
      const ex = prev.find((i) => i.variantId === item.variantId);
      if (ex) {
        return prev.map((i) =>
          i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + item.quantity, maxStock: item.maxStock }
            : i
        );
      }
      return [...prev, item];
    });
    setIsCartOpen(true);
    return true;
  };

  const removeItem = (variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number): boolean => {
    if (quantity <= 0) { removeItem(variantId); return true; }
    const item = items.find((i) => i.variantId === variantId);
    if (item?.maxStock && quantity > item.maxStock) return false;
    setItems((prev) =>
      prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i))
    );
    return true;
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, protectedApi } from '../lib/al/axios';
import type { Product } from '../types/product';

export interface CartItem {
   product: Product;
   qty: number;
}

export interface StockValidationResult {
   productId: string;
   requestedQty: number;
   availableStock: number;
   isValid: boolean;
   productTitle?: string;
}

interface CartState {
   items: CartItem[];

   addItem: (product: Product, qty: number) => void;
   removeItem: (productId: string) => void;
   updateQty: (productId: string, qty: number) => void;
   clearCart: () => void;
   getTotalItems: () => number;
   getTotalPrice: () => number;
   getItemCount: () => number;
   validateStock: (productId: string, qty: number) => Promise<StockValidationResult>;
   validateAllStock: () => Promise<StockValidationResult[]>;
}

const useCartStore = create<CartState>()(
   persist(
      (set, get) => ({
         items: [],

         addItem: (product, qty) => {
            const { items } = get();
            const existingItem = items.find((item) => item.product.id === product.id);

            if (existingItem) {
               // Update quantity if item already exists
               set({
                  items: items.map((item) =>
                     item.product.id === product.id ? { ...item, qty: item.qty + qty } : item
                  ),
               });
            } else {
               // Add new item
               set({ items: [...items, { product, qty }] });
            }
         },

         removeItem: (productId) => {
            set((state) => ({
               items: state.items.filter((item) => item.product.id !== productId),
            }));
         },

         updateQty: (productId, qty) => {
            if (qty <= 0) {
               get().removeItem(productId);
               return;
            }

            set((state) => ({
               items: state.items.map((item) =>
                  item.product.id === productId ? { ...item, qty } : item
               ),
            }));
         },

         clearCart: () => {
            set({ items: [] });
         },

         getTotalItems: () => {
            const { items } = get();
            return items.reduce((total, item) => total + item.qty, 0);
         },

         getTotalPrice: () => {
            const { items } = get();
            return items.reduce((total, item) => {
               const price = item.product.sale_price || 0;
               return total + price * item.qty;
            }, 0);
         },

         getItemCount: () => {
            const { items } = get();
            return items.length;
         },

         validateStock: async (productId, qty) => {
            try {
               const response = await api.get(`/catalog/stock/${productId}`);
               if (response.data.success && response.data.data) {
                  const product = response.data.data;
                  const availableStock = product.stock || 0;
                  return {
                     productId,
                     requestedQty: qty,
                     availableStock,
                     isValid: qty <= availableStock,
                     productTitle: product.title,
                  };
               }
               return {
                  productId,
                  requestedQty: qty,
                  availableStock: 0,
                  isValid: false,
               };
            } catch (error) {
               return {
                  productId,
                  requestedQty: qty,
                  availableStock: 0,
                  isValid: false,
               };
            }
         },

         validateAllStock: async () => {
            const { items } = get();
            const validationPromises = items.map((item) =>
               get().validateStock(item.product.id!, item.qty)
            );
            return Promise.all(validationPromises);
         },
      }),
      {
         name: 'cart-store', // localStorage key
      }
   )
);

export default useCartStore;

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoriteState {
   favorites: string[]; // Array of product IDs

   addFavorite: (productId: string) => void;
   removeFavorite: (productId: string) => void;
   isFavorite: (productId: string) => boolean;
   toggleFavorite: (productId: string) => void;
   clearFavorites: () => void;
}

const useFavoriteStore = create<FavoriteState>()(
   persist(
      (set, get) => ({
         favorites: [],

         addFavorite: (productId) => {
            const { favorites } = get();
            if (!favorites.includes(productId)) {
               set({ favorites: [...favorites, productId] });
            }
         },

         removeFavorite: (productId) => {
            set((state) => ({
               favorites: state.favorites.filter((id) => id !== productId),
            }));
         },

         isFavorite: (productId) => {
            const { favorites } = get();
            return favorites.includes(productId);
         },

         toggleFavorite: (productId) => {
            const { favorites, addFavorite, removeFavorite } = get();
            if (favorites.includes(productId)) {
               removeFavorite(productId);
            } else {
               addFavorite(productId);
            }
         },

         clearFavorites: () => {
            set({ favorites: [] });
         },
      }),
      {
         name: 'favorite-store', // localStorage key
      }
   )
);

export default useFavoriteStore;

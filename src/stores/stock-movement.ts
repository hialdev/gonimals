import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { protectedApi } from '../lib/al/axios';
import type { StockMovement } from '../types/stock-movement';

export interface StockMovementData extends StockMovement {}

interface StockMovementState {
   stockMovements: StockMovementData[];

   all: (params?: any) => Promise<any>;
   detail: ({ id }: { id: string }) => Promise<any>;
}

const useStockMovementStore = create<StockMovementState>()(
   persist(
      (set, get) => ({
         stockMovements: [],
         all: async (params?: any) => {
            const queryParams = new URLSearchParams();

            if (params) {
               if (params.page !== undefined) queryParams.append('page', params.page.toString());
               if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
               if (params.search !== undefined) queryParams.append('search', params.search);
               if (params.sort !== undefined) queryParams.append('sort', params.sort);
               if (params.order !== undefined) queryParams.append('order', params.order);
               if (params.product_id !== undefined)
                  queryParams.append('product_id', params.product_id);
               if (params.reference_type !== undefined)
                  queryParams.append('reference_type', params.reference_type);
            }

            const queryString = queryParams.toString();
            const url = queryString ? `/stock-movements?${queryString}` : '/stock-movements';

            const response = await protectedApi.get(url);
            if (response.data.success && response.data.data) {
               set({ stockMovements: response.data.data.stock_movements || response.data.data });
            }
            return response.data;
         },
         detail: async ({ id }) => {
            const response = await protectedApi.get(`/stock-movements/${id}`);
            return response.data;
         },
      }),
      {
         name: 'stock-movement-store',
         partialize: (state) => ({
            stockMovements: state.stockMovements,
         }),
      }
   )
);

export default useStockMovementStore;

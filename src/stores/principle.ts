import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { protectedApi } from '../lib/al/axios';
import type { Principle } from '../types/principle';

export interface PrincipleData extends Principle {}

interface PrincipleState {
   principles: PrincipleData[];

   all: (params?: any) => Promise<any>;
   detail: ({ id }: { id: string }) => Promise<any>;
   add: ({ data }: { data: PrincipleData }) => Promise<any>;
   update: ({ id, data }: { id: string; data: PrincipleData }) => Promise<any>;
   delete: ({ id }: { id: string }) => Promise<any>;
}

const usePrincipleStore = create<PrincipleState>()(
   persist(
      (set, get) => ({
         principles: [],
         all: async (params?: any) => {
            const queryParams = new URLSearchParams();

            if (params) {
               if (params.page !== undefined) queryParams.append('page', params.page.toString());
               if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
               if (params.search !== undefined) queryParams.append('search', params.search);
               if (params.sort !== undefined) queryParams.append('sort', params.sort);
               if (params.order !== undefined) queryParams.append('order', params.order);
            }

            const queryString = queryParams.toString();
            const url = queryString ? `/principles?${queryString}` : '/principles';

            const response = await protectedApi.get(url);
            if (response.data.success && response.data.data) {
               set({ principles: response.data.data.principles || response.data.data });
            }
            return response.data;
         },
         detail: async ({ id }) => {
            const response = await protectedApi.get(`/principles/${id}`);
            return response.data;
         },
         add: async ({ data }) => {
            const response = await protectedApi.post(`/principles`, data);
            return response.data;
         },
         update: async ({ id, data }) => {
            const response = await protectedApi.post(`/principles/${id}`, data);
            return response.data;
         },
         delete: async ({ id }) => {
            const response = await protectedApi.delete(`/principles/${id}`);
            return response.data;
         },
      }),
      {
         name: 'principle-store',
         partialize: (state) => ({
            principles: state.principles,
         }),
      }
   )
);

export default usePrincipleStore;

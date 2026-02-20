import { create } from 'zustand';

import { api, protectedApi } from '../lib/al/axios';
import type { Bank } from '../types/bank';

interface BankState {
   banks: Bank[];
   all: (params?: any) => Promise<any>;
   detail: ({ id }: { id: string }) => Promise<any>;
   add: ({ data }: { data: Partial<Bank> }) => Promise<any>;
   update: ({ id, data }: { id: string; data: Partial<Bank> }) => Promise<any>;
   delete: ({ id }: { id: string }) => Promise<any>;
}

const useBankStore = create<BankState>()((set) => ({
   banks: [],

   all: async (params?: any) => {
      const queryParams = new URLSearchParams();
      if (params) {
         if (params.page !== undefined) queryParams.append('page', params.page.toString());
         if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
         if (params.search !== undefined && params.search !== '')
            queryParams.append('search', params.search);
         if (params.is_active !== undefined) queryParams.append('is_active', params.is_active);
      }
      const url = `/banks${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      // Public endpoint — no auth needed for customer-facing bank list
      const response = await api.get(url);
      if (response.data.success && response.data.data) {
         set({ banks: response.data.data.banks || response.data.data });
      }
      return response.data;
   },

   detail: async ({ id }) => {
      const response = await api.get(`/banks/${id}`);
      return response.data;
   },

   add: async ({ data }) => {
      const response = await protectedApi.post('/banks', data);
      return response.data;
   },

   update: async ({ id, data }) => {
      const response = await protectedApi.post(`/banks/${id}`, data);
      return response.data;
   },

   delete: async ({ id }) => {
      const response = await protectedApi.delete(`/banks/${id}`);
      return response.data;
   },
}));

export default useBankStore;

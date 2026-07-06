import { create } from 'zustand';
import { protectedApi } from '../lib/al/axios';

interface DashboardState {
   salesData: any;
   stockData: any;
   purchaseData: any;

   getSalesData: (filter?: string) => Promise<any>;
   getStockData: () => Promise<any>;
   getPurchaseData: (filter?: string) => Promise<any>;
}

const useDashboardStore = create<DashboardState>()((set, get) => ({
   salesData: null,
   stockData: null,
   purchaseData: null,

   getSalesData: async (filter?: string) => {
      const response = await protectedApi.get('/dashboard/sales', { params: { filter } });
      if (response.data.success && response.data.data) {
         set({ salesData: response.data.data });
      }
      return response.data;
   },

   getStockData: async () => {
      const response = await protectedApi.get('/dashboard/stock');
      if (response.data.success && response.data.data) {
         set({ stockData: response.data.data });
      }
      return response.data;
   },

   getPurchaseData: async (filter?: string) => {
      const response = await protectedApi.get('/dashboard/purchase', { params: { filter } });
      if (response.data.success && response.data.data) {
         set({ purchaseData: response.data.data });
      }
      return response.data;
   },
}));

export default useDashboardStore;

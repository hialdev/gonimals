import { create } from 'zustand';
import { protectedApi } from '../lib/al/axios';

interface DashboardState {
   salesData: any;
   stockData: any;
   purchaseData: any;

   getSalesData: () => Promise<any>;
   getStockData: () => Promise<any>;
   getPurchaseData: () => Promise<any>;
}

const useDashboardStore = create<DashboardState>()((set, get) => ({
   salesData: null,
   stockData: null,
   purchaseData: null,

   getSalesData: async () => {
      const response = await protectedApi.get('/dashboard/sales');
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

   getPurchaseData: async () => {
      const response = await protectedApi.get('/dashboard/purchase');
      if (response.data.success && response.data.data) {
         set({ purchaseData: response.data.data });
      }
      return response.data;
   },
}));

export default useDashboardStore;

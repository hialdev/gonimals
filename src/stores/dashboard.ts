import { create } from 'zustand';
import { protectedApi } from '../lib/al/axios';

interface DashboardState {
   salesData: any;
   stockData: any;
   purchaseData: any;

   getSalesData: (startDate?: string, endDate?: string) => Promise<any>;
   getStockData: (startDate?: string, endDate?: string) => Promise<any>;
   getPurchaseData: (startDate?: string, endDate?: string) => Promise<any>;
}

const useDashboardStore = create<DashboardState>()((set, get) => ({
   salesData: null,
   stockData: null,
   purchaseData: null,

   getSalesData: async (startDate?: string, endDate?: string) => {
      const response = await protectedApi.get('/dashboard/sales', {
         params: { start_date: startDate, end_date: endDate },
      });
      if (response.data.success && response.data.data) {
         set({ salesData: response.data.data });
      }
      return response.data;
   },

   getStockData: async (startDate?: string, endDate?: string) => {
      const response = await protectedApi.get('/dashboard/stock', {
         params: { start_date: startDate, end_date: endDate },
      });
      if (response.data.success && response.data.data) {
         set({ stockData: response.data.data });
      }
      return response.data;
   },

   getPurchaseData: async (startDate?: string, endDate?: string) => {
      const response = await protectedApi.get('/dashboard/purchase', {
         params: { start_date: startDate, end_date: endDate },
      });
      if (response.data.success && response.data.data) {
         set({ purchaseData: response.data.data });
      }
      return response.data;
   },
}));

export default useDashboardStore;

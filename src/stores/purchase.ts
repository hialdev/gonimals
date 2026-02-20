import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { protectedApi } from '../lib/al/axios';
import type { Purchase } from '../types/purchase';

export interface PurchaseData extends Purchase {}

interface PurchaseState {
   purchases: PurchaseData[];

   all: (params?: any) => Promise<any>;
   detail: ({ id }: { id: string }) => Promise<any>;
   add: ({ data }: { data: any }) => Promise<any>;
   update: ({ id, data }: { id: string; data: any }) => Promise<any>;
   finish: ({ id }: { id: string }) => Promise<any>;
   receive: ({ id, data }: { id: string; data: any }) => Promise<any>;
   getLogs: ({ id }: { id: string }) => Promise<any>;
   delete: ({ id }: { id: string }) => Promise<any>;
}

const usePurchaseStore = create<PurchaseState>()(
   persist(
      (set, get) => ({
         purchases: [],
         all: async (params?: any) => {
            const queryParams = new URLSearchParams();

            if (params) {
               if (params.page !== undefined) queryParams.append('page', params.page.toString());
               if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
               if (params.search !== undefined && params.search !== '')
                  queryParams.append('search', params.search);
               if (params.sort !== undefined) queryParams.append('sort', params.sort);
               if (params.order !== undefined) queryParams.append('order', params.order);
               if (params.status !== undefined && params.status !== '')
                  queryParams.append('status', params.status);
               if (params.principle_ids !== undefined && params.principle_ids !== '')
                  queryParams.append('principle_ids', params.principle_ids);
               if (params.start_date !== undefined && params.start_date !== '')
                  queryParams.append('start_date', params.start_date);
               if (params.end_date !== undefined && params.end_date !== '')
                  queryParams.append('end_date', params.end_date);
            }

            const queryString = queryParams.toString();
            const url = queryString ? `/purchases?${queryString}` : '/purchases';

            const response = await protectedApi.get(url);
            if (response.data.success && response.data.data) {
               set({ purchases: response.data.data.purchases || response.data.data });
            }
            return response.data;
         },

         detail: async ({ id }) => {
            const response = await protectedApi.get(`/purchases/${id}`);
            return response.data;
         },
         add: async ({ data }) => {
            let payload: any = data;
            let config = {};

            // Check if there are file attachments
            if (
               data.attachments &&
               data.attachments.length > 0 &&
               data.attachments[0] instanceof File
            ) {
               const formData = new FormData();

               if (data.purchase_number) formData.append('purchase_number', data.purchase_number);
               if (data.purchase_date) formData.append('purchase_date', data.purchase_date);
               if (data.status) formData.append('status', data.status);
               if (data.principle_id) formData.append('principle_id', data.principle_id);
               if (data.products) formData.append('products', JSON.stringify(data.products));

               // Append file attachments
               data.attachments.forEach((file: File) => {
                  formData.append('attachments', file);
               });

               payload = formData;
               config = {
                  headers: {
                     'Content-Type': 'multipart/form-data',
                  },
               };
            }

            const response = await protectedApi.post(`/purchases`, payload, config);
            return response.data;
         },
         update: async ({ id, data }) => {
            let payload: any = data;
            let config = {};

            // Check if there are file attachments
            if (
               data.attachments &&
               data.attachments.length > 0 &&
               data.attachments[0] instanceof File
            ) {
               const formData = new FormData();

               if (data.purchase_number) formData.append('purchase_number', data.purchase_number);
               if (data.purchase_date) formData.append('purchase_date', data.purchase_date);
               if (data.status) formData.append('status', data.status);
               if (data.principle_id) formData.append('principle_id', data.principle_id);
               if (data.products) formData.append('products', JSON.stringify(data.products));

               // Append file attachments
               data.attachments.forEach((file: File) => {
                  formData.append('attachments', file);
               });

               payload = formData;
               config = {
                  headers: {
                     'Content-Type': 'multipart/form-data',
                  },
               };
            }

            const response = await protectedApi.post(`/purchases/${id}`, payload, config);
            return response.data;
         },
         finish: async ({ id }) => {
            const response = await protectedApi.post(`/purchases/${id}/finish`);
            return response.data;
         },
         receive: async ({ id, data }) => {
            const response = await protectedApi.post(`/purchases/${id}/receive`, data);
            return response.data;
         },
         getLogs: async ({ id }) => {
            const response = await protectedApi.get(`/purchases/${id}/receive-logs`);
            return response.data;
         },
         delete: async ({ id }) => {
            const response = await protectedApi.delete(`/purchases/${id}`);
            return response.data;
         },
      }),
      {
         name: 'purchase-store',
         partialize: (state) => ({
            purchases: state.purchases,
         }),
      }
   )
);

export default usePurchaseStore;

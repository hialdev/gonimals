import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { protectedApi } from '../lib/al/axios';
import type { Order } from '../types/order';

export interface OrderData extends Order {}

export interface CreateOrderInput {
   user_id: string;
   address_receiver: string;
   phone_receiver: string;
   notes?: string;
   products: {
      product_id: string;
      qty: number;
   }[];
}

interface OrderState {
   orders: OrderData[];

   all: (params?: any) => Promise<any>;
   detail: ({ id }: { id: string }) => Promise<any>;
   add: ({ data }: { data: any }) => Promise<any>;
   createOrder: ({ data }: { data: CreateOrderInput }) => Promise<any>;
   checkout: ({ data }: { data: CreateOrderInput }) => Promise<any>;
   getMyOrders: (params?: any) => Promise<any>;
   getMyOrder: ({ id }: { id: string }) => Promise<any>;
   requestRefund: ({ id }: { id: string }) => Promise<any>;
   waitRestock: ({ id }: { id: string }) => Promise<any>;
   confirmReceipt: ({ id }: { id: string }) => Promise<any>;

   // Admin actions
   adminRefund: ({ id, data }: { id: string; data: FormData }) => Promise<any>;
   adminCancel: ({ id, data }: { id: string; data: FormData }) => Promise<any>;
   adminConfirmRestock: ({ id, data }: { id: string; data: FormData }) => Promise<any>;
   adminDeliver: ({ id, data }: { id: string; data: FormData }) => Promise<any>;
   adminFinish: ({ id, data }: { id: string; data: FormData }) => Promise<any>;
   confirmPayment: ({ id }: { id: string }) => Promise<any>;
   rejectPayment: ({ id, reason }: { id: string; reason?: string }) => Promise<any>;
   uploadTransferProof: ({ id, data }: { id: string; data: FormData }) => Promise<any>;
}

const useOrderStore = create<OrderState>()(
   persist(
      (set, get) => ({
         orders: [],
         all: async (params?: any) => {
            const queryParams = new URLSearchParams();

            if (params) {
               if (params.page !== undefined) queryParams.append('page', params.page.toString());
               if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
               if (params.search !== undefined) queryParams.append('search', params.search);
               if (params.sort !== undefined) queryParams.append('sort', params.sort);
               if (params.order !== undefined) queryParams.append('order', params.order);
               if (params.status !== undefined) queryParams.append('status', params.status);
               if (params.user_id !== undefined) queryParams.append('user_id', params.user_id);
            }

            const queryString = queryParams.toString();
            const url = queryString ? `/orders?${queryString}` : '/orders';

            const response = await protectedApi.get(url);
            if (response.data.success && response.data.data) {
               set({ orders: response.data.data.orders || response.data.data });
            }
            return response.data;
         },
         detail: async ({ id }) => {
            const response = await protectedApi.get(`/orders/${id}`);
            return response.data;
         },
         add: async ({ data }) => {
            const response = await protectedApi.post(`/orders`, data);
            return response.data;
         },
         createOrder: async ({ data }) => {
            const response = await protectedApi.post(`/orders`, data);
            if (response.data.success && response.data.data) {
               set((state) => ({
                  orders: [response.data.data, ...state.orders],
               }));
            }
            return response.data;
         },
         checkout: async ({ data }) => {
            const response = await protectedApi.post(`/user/checkout`, data);
            // No need to update global admin/all orders state here, my-orders view will fetch own data
            return response.data;
         },
         getMyOrders: async (params?: any) => {
            const queryParams = new URLSearchParams();

            if (params) {
               if (params.page !== undefined) queryParams.append('page', params.page.toString());
               if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
               if (params.search !== undefined) queryParams.append('search', params.search);
               if (params.sort !== undefined) queryParams.append('sort', params.sort);
               if (params.order !== undefined) queryParams.append('order', params.order);
               if (params.status !== undefined) queryParams.append('status', params.status);
            }

            const queryString = queryParams.toString();
            const url = queryString ? `/user/my-orders?${queryString}` : `/user/my-orders`;

            const response = await protectedApi.get(url);
            return response.data;
         },
         getMyOrder: async ({ id }: { id: string }) => {
            const response = await protectedApi.get(`/user/my-orders/${id}`);
            return response.data;
         },
         requestRefund: async ({ id }) => {
            const response = await protectedApi.post(`/orders/${id}/request-refund`);
            return response.data;
         },
         waitRestock: async ({ id }) => {
            const response = await protectedApi.post(`/orders/${id}/wait-restock`);
            return response.data;
         },
         confirmReceipt: async ({ id }) => {
            const response = await protectedApi.post(`/user/my-orders/${id}/confirm-receipt`);
            return response.data;
         },

         // Admin actions
         adminRefund: async ({ id, data }) => {
            const response = await protectedApi.post(`/orders/${id}/admin-refund`, data, {
               headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
         },
         adminCancel: async ({ id, data }) => {
            const response = await protectedApi.post(`/orders/${id}/admin-cancel`, data, {
               headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
         },
         adminConfirmRestock: async ({ id, data }) => {
            const response = await protectedApi.post(`/orders/${id}/admin-confirm-restock`, data, {
               headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
         },
         adminDeliver: async ({ id, data }) => {
            const response = await protectedApi.post(`/orders/${id}/admin-deliver`, data, {
               headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
         },
         adminFinish: async ({ id, data }) => {
            const response = await protectedApi.post(`/orders/${id}/admin-finish`, data, {
               headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
         },
         confirmPayment: async ({ id }) => {
            const response = await protectedApi.post(`/orders/${id}/confirm-payment`);
            return response.data;
         },
         rejectPayment: async ({ id, reason }) => {
            const form = new FormData();
            if (reason) form.append('reason', reason);
            const response = await protectedApi.post(`/orders/${id}/reject-payment`, form, {
               headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
         },
         uploadTransferProof: async ({ id, data }) => {
            const response = await protectedApi.post(
               `/user/my-orders/${id}/upload-transfer`,
               data,
               {
                  headers: { 'Content-Type': 'multipart/form-data' },
               }
            );
            return response.data;
         },
      }),
      {
         name: 'order-store',
         partialize: (state) => ({
            orders: state.orders,
         }),
      }
   )
);

export default useOrderStore;

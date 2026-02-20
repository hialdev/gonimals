import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { api, protectedApi } from '../lib/al/axios';
import type { Product } from '../types/product';

export interface ProductData extends Product {}

interface ProductState {
   products: ProductData[];

   all: (params?: any) => Promise<any>;
   getCatalog: (params?: any) => Promise<any>;
   detail: ({ id }: { id: string }) => Promise<any>;
   add: ({ data }: { data: ProductData }) => Promise<any>;
   update: ({ id, data }: { id: string; data: ProductData }) => Promise<any>;
   delete: ({ id }: { id: string }) => Promise<any>;
}

const useProductStore = create<ProductState>()(
   persist(
      (set, get) => ({
         products: [],
         all: async (params?: any) => {
            const queryParams = new URLSearchParams();

            if (params) {
               if (params.page !== undefined) queryParams.append('page', params.page.toString());
               if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
               if (params.search !== undefined) queryParams.append('search', params.search);
               if (params.sort !== undefined) queryParams.append('sort', params.sort);
               if (params.order !== undefined) queryParams.append('order', params.order);
               if (params.product_type_id !== undefined)
                  queryParams.append('product_type_id', params.product_type_id);
               if (params.is_active !== undefined)
                  queryParams.append('is_active', params.is_active);
            }

            const queryString = queryParams.toString();
            const url = queryString ? `/products?${queryString}` : '/products';

            const response = await protectedApi.get(url);
            if (response.data.success && response.data.data) {
               set({ products: response.data.data.products || response.data.data });
            }
            return response.data;
         },
         getCatalog: async (params?: any) => {
            const queryParams = new URLSearchParams();

            if (params) {
               if (params.page !== undefined) queryParams.append('page', params.page.toString());
               if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
               if (params.search !== undefined) queryParams.append('search', params.search);
               if (params.sort !== undefined) queryParams.append('sort', params.sort);
               if (params.order !== undefined) queryParams.append('order', params.order);
               if (params.product_type_id !== undefined)
                  queryParams.append('product_type_id', params.product_type_id);
            }

            const queryString = queryParams.toString();
            const url = queryString ? `/catalog?${queryString}` : '/catalog';

            const response = await api.get(url);
            if (response.data.success && response.data.data) {
               set({ products: response.data.data.products || response.data.data });
            }
            return response.data;
         },
         detail: async ({ id }) => {
            const response = await protectedApi.get(`/products/${id}`);
            return response.data;
         },
         add: async ({ data }) => {
            let payload: any = data;
            let config = {};

            // If image is a File, use FormData
            if (data.image instanceof File) {
               const formData = new FormData();

               if (data.product_number) formData.append('product_number', data.product_number);
               if (data.product_type_id) formData.append('product_type_id', data.product_type_id);
               if (data.title) formData.append('title', data.title);
               if (data.slug) formData.append('slug', data.slug);
               if (data.description) formData.append('description', data.description);
               if (data.sale_price !== undefined)
                  formData.append('sale_price', data.sale_price.toString());
               if (data.content) formData.append('content', data.content);
               if (data.is_active !== undefined)
                  formData.append('is_active', data.is_active.toString());
               if (data.image instanceof File) {
                  formData.append('image', data.image);
               }

               payload = formData;
               config = {
                  headers: {
                     'Content-Type': 'multipart/form-data',
                  },
               };
            }

            const response = await protectedApi.post(`/products`, payload, config);
            return response.data;
         },
         update: async ({ id, data }) => {
            let payload: any = data;
            let config = {};

            // If image is a File, use FormData
            if (data.image instanceof File) {
               const formData = new FormData();

               if (data.product_number) formData.append('product_number', data.product_number);
               if (data.product_type_id) formData.append('product_type_id', data.product_type_id);
               if (data.title) formData.append('title', data.title);
               if (data.slug) formData.append('slug', data.slug);
               if (data.description) formData.append('description', data.description);
               if (data.sale_price !== undefined)
                  formData.append('sale_price', data.sale_price.toString());
               if (data.content) formData.append('content', data.content);
               if (data.is_active !== undefined)
                  formData.append('is_active', data.is_active.toString());
               if (data.image instanceof File) {
                  formData.append('image', data.image);
               }

               payload = formData;
               config = {
                  headers: {
                     'Content-Type': 'multipart/form-data',
                  },
               };
            }

            const response = await protectedApi.post(`/products/${id}`, payload, config);
            return response.data;
         },
         delete: async ({ id }) => {
            const response = await protectedApi.delete(`/products/${id}`);
            return response.data;
         },
      }),
      {
         name: 'product-store',
         partialize: (state) => ({
            products: state.products,
         }),
      }
   )
);

export default useProductStore;

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { protectedApi } from '../lib/al/axios';
import type { ProductType } from '../types/product-type';

export interface ProductTypeData extends ProductType {}

interface ProductTypeState {
   productTypes: ProductTypeData[];

   all: (params?: any) => Promise<any>;
   detail: ({ id }: { id: string }) => Promise<any>;
   add: ({ data }: { data: ProductTypeData }) => Promise<any>;
   update: ({ id, data }: { id: string; data: ProductTypeData }) => Promise<any>;
   delete: ({ id }: { id: string }) => Promise<any>;
}

const useProductTypeStore = create<ProductTypeState>()(
   persist(
      (set, get) => ({
         productTypes: [],
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
            const url = queryString ? `/product-types?${queryString}` : '/product-types';

            const response = await protectedApi.get(url);
            if (response.data.success && response.data.data) {
               set({ productTypes: response.data.data.product_types || response.data.data });
            }
            return response.data;
         },
         detail: async ({ id }) => {
            const response = await protectedApi.get(`/product-types/${id}`);
            return response.data;
         },
         add: async ({ data }) => {
            let payload: ProductTypeData | FormData = data;
            let config = {};

            // If image is a File, use FormData
            if (data.image instanceof File) {
               const formData = new FormData();

               if (data.title) formData.append('title', data.title);
               if (data.slug) formData.append('slug', data.slug);
               if (data.description) formData.append('description', data.description);
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

            const response = await protectedApi.post(`/product-types`, payload, config);
            return response.data;
         },
         update: async ({ id, data }) => {
            let payload: ProductTypeData | FormData = data;
            let config = {};

            // If image is a File, use FormData
            if (data.image instanceof File) {
               const formData = new FormData();

               if (data.title) formData.append('title', data.title);
               if (data.slug) formData.append('slug', data.slug);
               if (data.description) formData.append('description', data.description);
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

            const response = await protectedApi.post(`/product-types/${id}`, payload, config);
            return response.data;
         },
         delete: async ({ id }) => {
            const response = await protectedApi.delete(`/product-types/${id}`);
            return response.data;
         },
      }),
      {
         name: 'product-type-store',
         partialize: (state) => ({
            productTypes: state.productTypes,
         }),
      }
   )
);

export default useProductTypeStore;

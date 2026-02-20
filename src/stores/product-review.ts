import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { protectedApi, api } from '../lib/al/axios';

interface ProductReviewState {
   add: (data: any) => Promise<any>;
   getByProduct: (productId: string, params?: any) => Promise<any>;
   getAll: (params?: any) => Promise<any>;
   toggleVisibility: (id: string) => Promise<any>;
   delete: (id: string) => Promise<any>;
}

const useProductReviewStore = create<ProductReviewState>()((set, get) => ({
   add: async (data) => {
      let payload: any = data;
      let config = {};

      // Jika ada images, selalu gunakan FormData
      if (data.images && data.images.length > 0) {
         const formData = new FormData();

         if (data.product_id) formData.append('product_id', String(data.product_id));
         if (data.order_id) formData.append('order_id', String(data.order_id));
         if (data.rating) formData.append('rating', String(data.rating));
         if (data.comment) formData.append('comment', String(data.comment));

         // Append file attachments
         data.images.forEach((file: any) => {
            // Some file pickers might wrap the file, this tries to safely extract it or just append
            formData.append(
               'images',
               file instanceof File || file instanceof Blob
                  ? file
                  : file.originFileObj || file.file || file
            );
         });

         payload = formData;
         config = {
            headers: {
               'Content-Type': 'multipart/form-data',
            },
         };
      }

      const response = await protectedApi.post('/user/reviews', payload, config);
      return response.data;
   },

   getByProduct: async (productId, params) => {
      const queryParams = new URLSearchParams();
      if (params) {
         if (params.page !== undefined) queryParams.append('page', params.page.toString());
         if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      }

      const queryString = queryParams.toString();
      const url = queryString
         ? `/catalog/reviews/${productId}?${queryString}`
         : `/catalog/reviews/${productId}`;

      const response = await api.get(url);
      return response.data;
   },

   getAll: async (params) => {
      const queryParams = new URLSearchParams();
      if (params) {
         if (params.page !== undefined) queryParams.append('page', params.page.toString());
         if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
         if (params.search !== undefined) queryParams.append('search', params.search);
      }

      const queryString = queryParams.toString();
      const url = queryString ? `/reviews?${queryString}` : '/reviews';

      const response = await protectedApi.get(url);
      return response.data;
   },

   toggleVisibility: async (id) => {
      const response = await protectedApi.patch(`/reviews/${id}/toggle-visibility`);
      return response.data;
   },

   delete: async (id) => {
      const response = await protectedApi.delete(`/reviews/${id}`);
      return response.data;
   },
}));

export default useProductReviewStore;

import type { Product } from 'src/types/product';

import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { Typography } from '@mui/material';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { CONFIG } from 'src/global-config';
import useProductStore from 'src/stores/product';
import useProductTypeStore from 'src/stores/product-type';
import { ProductSchema, type ProductFormType } from 'src/types/product';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { slugify } from '../../product-type/helpers/slug';

// ----------------------------------------------------------------------

type Props = {
   open: boolean;
   onClose: () => void;
   onSuccess?: () => void;
   currentProduct?: Product;
};

export function ProductCUForm({ currentProduct, open, onClose, onSuccess }: Props) {
   const { update, add } = useProductStore();
   const { productTypes, all: getAllProductTypes } = useProductTypeStore();
   const [slug, setSlug] = useState<string>(currentProduct?.slug ?? '');

   useEffect(() => {
      getAllProductTypes({ limit: 100 });
   }, []);

   const defaultValues: ProductFormType = {
      product_number: currentProduct?.product_number || '',
      product_type_id: currentProduct?.product_type_id || '',
      title: currentProduct?.title || '',
      slug: currentProduct?.slug || '',
      image: currentProduct?.image ? `${CONFIG.apiHostUrl}/${currentProduct.image}` : undefined,
      description: currentProduct?.description || '',
      sale_price: currentProduct?.sale_price || 0,
      content: currentProduct?.content || '',
      is_active: currentProduct?.is_active ?? true,
   };

   const methods = useForm({
      mode: 'onSubmit',
      resolver: zodResolver(ProductSchema),
      defaultValues,
   });

   const {
      handleSubmit,
      formState: { isSubmitting },
      reset,
   } = methods;

   const onSubmit = handleSubmit(async (data) => {
      try {
         const formData = {
            ...data,
            slug: slug || data.slug,
         };

         let result;
         if (currentProduct?.id) {
            result = await update({ id: currentProduct.id, data: formData as Product });
         } else {
            result = await add({ data: formData as Product });
         }

         if (result.success) {
            toast.success(
               currentProduct ? 'Product updated successfully!' : 'Product created successfully!'
            );
            reset();
            onClose();
            if (onSuccess) onSuccess();
         } else {
            toast.error(result.message || 'An error occurred');
         }
      } catch (error) {
         console.error(error);
         toast.error('An error occurred');
      }
   });

   const handleClose = () => {
      reset();
      setSlug('');
      onClose();
   };

   const productTypeOptions = productTypes.map((pt) => ({
      label: pt.title || '',
      value: pt.id || '',
   }));

   return (
      <Dialog
         fullWidth
         maxWidth="md"
         open={open}
         onClose={handleClose}
         PaperProps={{ sx: { borderRadius: 2 } }}
      >
         <DialogTitle sx={{ pb: 2 }}>
            {currentProduct ? 'Edit Product' : 'Add New Product'}
         </DialogTitle>

         <Form methods={methods} onSubmit={onSubmit}>
            <DialogContent dividers sx={{ pt: 3, pb: 3 }}>
               <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                     <Field.Upload
                        name="image"
                        maxSize={5242880}
                        helperText={
                           <Typography
                              variant="caption"
                              sx={{
                                 mt: 1,
                                 display: 'block',
                                 textAlign: 'center',
                                 color: 'text.disabled',
                              }}
                           >
                              Allowed *.jpeg, *.jpg, *.png, max size of 5MB
                           </Typography>
                        }
                     />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                     <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                           <Field.Text
                              name="product_number"
                              label="Product Number (SKU)"
                              fullWidth
                           />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                           <Field.Autocomplete
                              name="product_type_id"
                              label="Product Type"
                              options={productTypeOptions}
                              fullWidth
                           />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                           <Field.Text
                              name="title"
                              label="Product Title"
                              fullWidth
                              onBlur={(e) => setSlug(slugify(e.target.value))}
                           />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                           <Field.Text
                              name="slug"
                              label="Slug"
                              fullWidth
                              value={slug}
                              disabled
                              helperText="URL-friendly version"
                           />
                        </Grid>
                     </Grid>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                     <Field.Text
                        multiline
                        name="description"
                        label="Description"
                        minRows={2}
                        fullWidth
                     />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                     <Field.Text
                        name="sale_price"
                        label="Sale Price"
                        type="number"
                        fullWidth
                        InputProps={{
                           startAdornment: <Typography sx={{ mr: 1 }}>Rp</Typography>,
                        }}
                     />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                     <Field.Switch name="is_active" label="Active" />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                     <Field.Text
                        multiline
                        name="content"
                        label="Content (Rich Text)"
                        minRows={4}
                        fullWidth
                     />
                  </Grid>
               </Grid>
            </DialogContent>

            <DialogActions>
               <Button onClick={handleClose} variant="outlined" color="inherit">
                  Cancel
               </Button>
               <Button type="submit" variant="contained" loading={isSubmitting}>
                  {currentProduct ? 'Update' : 'Create'}
               </Button>
            </DialogActions>
         </Form>
      </Dialog>
   );
}

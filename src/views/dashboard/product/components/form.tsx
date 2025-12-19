import type { Product } from 'src/types/product';

import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/al/paths';
import { useRouter } from 'src/routes/hooks';
import { CONFIG } from 'src/global-config';
import useProductStore from 'src/stores/product';
import useProductTypeStore from 'src/stores/product-type';
import { ProductSchema, type ProductFormType } from 'src/types/product';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { slugify } from '../../product-type/helpers/slug';
import { ProductTypeCUForm } from '../../product-type/forms/product-type-cu-form';

// ----------------------------------------------------------------------

type Props = {
   onSuccess?: () => void;
   currentProduct?: Product;
};

export function ProductForm({ currentProduct, onSuccess }: Props) {
   const router = useRouter();
   const { update, add } = useProductStore();
   const { productTypes, all: getAllProductTypes } = useProductTypeStore();
   const [slug, setSlug] = useState<string>(currentProduct?.slug ?? '');
   const addProductTypeDialog = useBoolean();

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
         const formData: any = {
            ...data,
            slug: slug || data.slug,
         };

         // Remove image field if it's still a URL string (not changed)
         if (typeof formData.image === 'string' && formData.image.startsWith('http')) {
            delete formData.image;
         }

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
            onSuccess?.();
            reset();
            router.push(paths.dashboard.products.root);
         } else {
            toast.error(result.message || 'An error occurred');
         }
      } catch (error) {
         console.error(error);
         toast.error('An error occurred');
      }
   });

   const handleProductTypeAdded = () => {
      getAllProductTypes({ limit: 100 });
      toast.success('Product Type added! You can now select it.');
   };

   const productTypeOptions = productTypes.map((pt) => ({
      label: pt.title || '',
      value: pt.id || '',
   }));

   return (
      <>
         <Form methods={methods} onSubmit={onSubmit}>
            <Box sx={{ pt: 1, pb: 3, flexGrow: 1, overflow: 'auto' }}>
               <Grid container spacing={3}>
                  {/* Left Column - Basic Info */}
                  <Grid size={{ xs: 12, md: 6 }}>
                     <Box sx={{ mb: 3 }}>
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
                     </Box>

                     <Grid container spacing={3}>
                        <Grid size={{ xs: 12 }} sx={{ mb: 1 }}>
                           <Field.Text
                              name="product_number"
                              label="Product Number (SKU)"
                              fullWidth
                           />
                        </Grid>

                        <Grid
                           size={{ xs: 12 }}
                           sx={{ mb: 1 }}
                           display="flex"
                           alignItems="center"
                           gap={2}
                        >
                           <Box sx={{ flex: 1 }}>
                              <Field.Autocomplete
                                 name="product_type_id"
                                 label="Product Type"
                                 options={productTypeOptions}
                                 getOptionLabel={(option) =>
                                    typeof option === 'string'
                                       ? productTypeOptions.find((o) => o.value === option)
                                            ?.label || option
                                       : option.label
                                 }
                                 isOptionEqualToValue={(option, value) => {
                                    const optionValue =
                                       typeof option === 'string' ? option : option.value;
                                    const compareValue =
                                       typeof value === 'string' ? value : value.value;
                                    return optionValue === compareValue;
                                 }}
                                 onChange={(event, newValue) => {
                                    const valueToSet =
                                       typeof newValue === 'string'
                                          ? newValue
                                          : newValue?.value || '';
                                    methods.setValue('product_type_id', valueToSet);
                                 }}
                              />
                           </Box>
                           <IconButton
                              edge="start"
                              onClick={addProductTypeDialog.onTrue}
                              color="primary"
                           >
                              <Iconify icon="mingcute:add-line" />
                           </IconButton>
                        </Grid>

                        <Grid size={{ xs: 12 }} sx={{ mb: 1 }}>
                           <Field.Text
                              name="title"
                              label="Product Title"
                              fullWidth
                              onBlur={(e) => setSlug(slugify(e.target.value))}
                           />
                        </Grid>

                        <Grid size={{ xs: 12 }} sx={{ mb: 1 }}>
                           <Field.Text
                              name="slug"
                              label="Slug"
                              fullWidth
                              value={slug}
                              aria-readonly
                              helperText="URL-friendly version of the title"
                           />
                        </Grid>

                        <Grid size={{ xs: 12 }} sx={{ mb: 1 }}>
                           <Field.Text
                              multiline
                              name="description"
                              label="Description"
                              minRows={3}
                              fullWidth
                              helperText="Also used as SEO meta description"
                           />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }} sx={{ mb: 1 }}>
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

                        <Grid size={{ xs: 12, md: 6 }} sx={{ mb: 1 }}>
                           <Field.Switch name="is_active" label="Active" />
                        </Grid>
                     </Grid>
                  </Grid>

                  {/* Right Column - Content */}
                  <Grid size={{ xs: 12, md: 6 }}>
                     <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                           Product Content
                        </Typography>
                        <Field.Editor name="content" />
                     </Box>
                  </Grid>
               </Grid>
            </Box>

            <Box sx={{ position: 'sticky', bottom: 0, end: 0, start: 0, zIndex: 99, pb: 2 }}>
               <Button type="submit" variant="contained" fullWidth loading={isSubmitting}>
                  {currentProduct ? 'Update' : 'Add New'}
               </Button>
            </Box>
         </Form>

         {/* Quick Add Product Type Modal */}
         <ProductTypeCUForm
            open={addProductTypeDialog.value}
            onClose={addProductTypeDialog.onFalse}
            onSuccess={handleProductTypeAdded}
         />
      </>
   );
}

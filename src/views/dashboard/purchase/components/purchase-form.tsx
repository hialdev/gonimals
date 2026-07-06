import type { Purchase, PurchaseProduct } from 'src/types/purchase';

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import { Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';

import { paths } from 'src/routes/al/paths';
import { useRouter } from 'src/routes/hooks';
import { CONFIG } from 'src/global-config';
import useProductStore from 'src/stores/product';
import usePurchaseStore from 'src/stores/purchase';
import usePrincipleStore from 'src/stores/principle';
import {
   PurchaseSchema,
   type PurchaseFormType,
   type PurchaseItemFormType,
} from 'src/types/purchase';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type Props = {
   currentPurchase?: Purchase;
};

export function PurchaseForm({ currentPurchase }: Props) {
   const router = useRouter();
   const { update, add } = usePurchaseStore();
   const { products, all: getAllProducts } = useProductStore();
   const { principles, all: getAllPrinciples } = usePrincipleStore();

   useEffect(() => {
      getAllProducts({ limit: 100 });
      getAllPrinciples({ limit: 100 });
   }, []);

   // Helper function to convert PurchaseProduct[] to PurchaseItemFormType[]
   const convertPurchaseProductsToFormItems = (
      products?: PurchaseProduct[]
   ): PurchaseItemFormType[] => {
      if (!products || products.length === 0) {
         return [
            {
               product_id: '',
               qty: 1,
               purchase_price: 0,
            },
         ];
      }

      return products.map((product) => ({
         product_id: product.product_id || '',
         qty: product.qty || 1,
         purchase_price: product.purchase_price || 0,
      }));
   };

   const defaultValues: PurchaseFormType = {
      principle_id: currentPurchase?.principle_id || '',
      purchase_date: currentPurchase?.purchase_date || new Date().toISOString().split('T')[0],
      expected_arrival_date: currentPurchase?.expected_arrival_date || '',
      notes: currentPurchase?.notes || '',
      items: convertPurchaseProductsToFormItems(
         currentPurchase?.purchase_products || currentPurchase?.items
      ),
   };

   const methods = useForm({
      mode: 'onSubmit',
      resolver: zodResolver(PurchaseSchema),
      defaultValues,
   });

   const {
      control,
      handleSubmit,
      watch,
      formState: { isSubmitting },
   } = methods;

   const { fields, append, remove } = useFieldArray({
      control,
      name: 'items',
   });

   const onSubmit = handleSubmit(async (data) => {
      try {
         // Convert purchase_date to ISO datetime format for backend
         // Map 'items' to 'products' as expected by backend
         const formattedData = {
            purchase_number: currentPurchase?.purchase_number || `PO-${Date.now()}`, // Preserve existing or auto-generate
            purchase_date: data.purchase_date
               ? new Date(data.purchase_date).toISOString()
               : new Date().toISOString(),
            expected_arrival_date: data.expected_arrival_date
               ? new Date(data.expected_arrival_date).toISOString()
               : undefined,
            status: currentPurchase?.status || 'completed', // Preserve existing or default
            principle_id: data.principle_id,
            notes: data.notes || '',
            products: data.items, // Backend expects 'products', not 'items'
         };

         let result;
         if (currentPurchase?.id) {
            result = await update({ id: currentPurchase.id, data: formattedData as any });
         } else {
            result = await add({ data: formattedData as any });
         }

         if (result.success) {
            toast.success(
               currentPurchase ? 'Purchase updated successfully!' : 'Purchase created successfully!'
            );
            router.push(paths.dashboard.purchases.root);
         } else {
            toast.error(result.message || 'An error occurred');
         }
      } catch (error) {
         console.error(error);
         toast.error('An error occurred');
      }
   });

   const principleOptions = principles.map((p) => ({
      label: p.title || '',
      value: p.id || '',
   }));

   const productOptions = products.map((p) => ({
      label: `${p.product_number} - ${p.title}`,
      value: p.id || '',
      image: p.image,
      price: p.sale_price,
   }));

   const watchedItems = watch('items') as PurchaseItemFormType[];

   const totalAmount = watchedItems.reduce((sum, item) => {
      return sum + Number(item.qty || 0) * Number(item.purchase_price || 0);
   }, 0);

   return (
      <Form methods={methods} onSubmit={onSubmit}>
         <Grid container spacing={3}>
            {/* Left Column - Purchase Info */}
            <Grid size={{ xs: 12, md: 4 }}>
               <Card sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3 }}>
                     Purchase Information
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                     <Field.Autocomplete
                        name="principle_id"
                        label="Supplier / Vendor"
                        options={principleOptions}
                        getOptionLabel={(option) =>
                           typeof option === 'string'
                              ? principleOptions.find((o) => o.value === option)?.label || option
                              : option.label
                        }
                        isOptionEqualToValue={(option, value) => {
                           const optionValue = typeof option === 'string' ? option : option.value;
                           const compareValue = typeof value === 'string' ? value : value.value;
                           return optionValue === compareValue;
                        }}
                        onChange={(event, newValue) => {
                           const valueToSet =
                              typeof newValue === 'string' ? newValue : newValue?.value || '';
                           methods.setValue('principle_id', valueToSet);
                        }}
                     />

                     <Field.DatePicker name="purchase_date" label="Purchase Date" maxDate={dayjs()} />
                     <Field.DatePicker name="expected_arrival_date" label="Expected Arrival Date" />

                     <Field.Text
                        multiline
                        name="notes"
                        label="Notes"
                        minRows={4}
                        placeholder="Additional notes..."
                     />

                     <Box
                        sx={{
                           p: 2,
                           borderRadius: 1,
                           bgcolor: 'background.neutral',
                        }}
                     >
                        <Typography variant="subtitle2" color="text.secondary">
                           Total Amount
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1 }}>
                           Rp {totalAmount.toLocaleString()}
                        </Typography>
                     </Box>
                  </Box>
               </Card>
            </Grid>

            {/* Right Column - Products */}
            <Grid size={{ xs: 12, md: 8 }}>
               <Card>
                  <CardHeader
                     title="Products"
                     action={
                        <Button
                           size="small"
                           startIcon={<Iconify icon="mingcute:add-line" />}
                           onClick={() =>
                              append({
                                 product_id: '',
                                 qty: 1,
                                 purchase_price: 0,
                              })
                           }
                        >
                           Add Product
                        </Button>
                     }
                  />

                  <Box sx={{ p: 3 }}>
                     {fields.map((field, index) => {
                        const selectedProduct = products.find(
                           (p) => p.id === watchedItems[index]?.product_id
                        );

                        return (
                           <Card
                              key={field.id}
                              sx={{
                                 p: 2,
                                 mb: 2,
                                 border: '1px solid',
                                 borderColor: 'divider',
                              }}
                           >
                              <Box
                                 sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 2,
                                 }}
                              >
                                 {selectedProduct?.image && (
                                    <Avatar
                                       src={`${CONFIG.apiHostUrl}/${selectedProduct.image}`}
                                       variant="rounded"
                                       sx={{ width: 80, height: 80 }}
                                    />
                                 )}

                                 <Box sx={{ flex: 1 }}>
                                    <Grid container spacing={2}>
                                       <Grid size={{ xs: 12 }}>
                                          <Field.Autocomplete
                                             name={`items.${index}.product_id`}
                                             label="Product"
                                             placeholder="Select Product"
                                             options={productOptions}
                                             getOptionLabel={(option) =>
                                                typeof option === 'string'
                                                   ? productOptions.find((o) => o.value === option)
                                                        ?.label || option
                                                   : option.label
                                             }
                                             isOptionEqualToValue={(option, value) => {
                                                const optionValue =
                                                   typeof option === 'string'
                                                      ? option
                                                      : option.value;
                                                const compareValue =
                                                   typeof value === 'string' ? value : value.value;
                                                return optionValue === compareValue;
                                             }}
                                             onChange={(event, newValue) => {
                                                const valueToSet =
                                                   typeof newValue === 'string'
                                                      ? newValue
                                                      : newValue?.value || '';
                                                methods.setValue(
                                                   `items.${index}.product_id`,
                                                   valueToSet
                                                );
                                             }}
                                          />
                                       </Grid>

                                       <Grid size={{ xs: 12, sm: 6 }}>
                                          <Field.Text
                                             name={`items.${index}.qty`}
                                             label="Quantity"
                                             type="number"
                                             fullWidth
                                             InputProps={{
                                                inputProps: { min: 1 },
                                             }}
                                          />
                                       </Grid>

                                       <Grid size={{ xs: 12, sm: 6 }}>
                                          <Field.Text
                                             name={`items.${index}.purchase_price`}
                                             label="Purchase Price"
                                             type="number"
                                             fullWidth
                                             InputProps={{
                                                startAdornment: (
                                                   <Typography sx={{ mr: 1 }}>Rp</Typography>
                                                ),
                                                inputProps: { min: 0 },
                                             }}
                                          />
                                       </Grid>

                                       <Grid size={{ xs: 12 }}>
                                          <Typography variant="body2" color="text.secondary">
                                             Subtotal: Rp{' '}
                                             {(
                                                Number(watchedItems[index]?.qty || 0) *
                                                Number(watchedItems[index]?.purchase_price || 0)
                                             ).toLocaleString()}
                                          </Typography>
                                       </Grid>
                                    </Grid>
                                 </Box>

                                 <IconButton
                                    color="error"
                                    onClick={() => remove(index)}
                                    disabled={fields.length === 1}
                                 >
                                    <Iconify icon="solar:trash-bin-trash-bold" />
                                 </IconButton>
                              </Box>
                           </Card>
                        );
                     })}
                  </Box>
               </Card>
            </Grid>

            {/* Submit Button */}
            <Grid size={{ xs: 12 }}>
               <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                     variant="outlined"
                     color="inherit"
                     onClick={() => router.push(paths.dashboard.purchases.root)}
                  >
                     Cancel
                  </Button>
                  <Button type="submit" variant="contained" loading={isSubmitting}>
                     {currentPurchase ? 'Update Purchase' : 'Create Purchase'}
                  </Button>
               </Box>
            </Grid>
         </Grid>
      </Form>
   );
}

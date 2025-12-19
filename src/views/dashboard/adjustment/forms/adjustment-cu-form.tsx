import type { Adjustment } from 'src/types/adjustment';

import * as z from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { Alert } from '@mui/material';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import useProductStore from 'src/stores/product';
import useAdjustmentStore from 'src/stores/adjustment';
import { AdjustmentSchema, type AdjustmentFormType } from 'src/types/adjustment';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type Props = {
   open: boolean;
   onClose: () => void;
   onSuccess?: () => void;
   currentAdjustment?: Adjustment;
};

export function AdjustmentCUForm({ currentAdjustment, open, onClose, onSuccess }: Props) {
   const { update, add } = useAdjustmentStore();
   const { products, all: getAllProducts } = useProductStore();

   useEffect(() => {
      getAllProducts({ limit: 100 });
   }, []);

   const defaultValues: AdjustmentFormType = {
      product_id: currentAdjustment?.product_id || '',
      qty: currentAdjustment?.qty || 1,
      is_increment: currentAdjustment?.is_increment ?? true,
      description: currentAdjustment?.description || '',
   };

   const methods = useForm({
      mode: 'onSubmit',
      resolver: zodResolver(AdjustmentSchema),
      defaultValues,
   });

   const {
      handleSubmit,
      watch,
      formState: { isSubmitting },
      reset,
   } = methods;

   const watchIsIncrement = watch('is_increment');

   const onSubmit = handleSubmit(async (data) => {
      try {
         let result;
         if (currentAdjustment?.id) {
            result = await update({ id: currentAdjustment.id, data: data as Adjustment });
         } else {
            result = await add({ data: data as Adjustment });
         }

         if (result.success) {
            toast.success(
               currentAdjustment
                  ? 'Adjustment updated successfully!'
                  : 'Adjustment created successfully!'
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
      onClose();
   };

   const productOptions = products.map((p) => ({
      label: `${p.product_number} - ${p.title}`,
      value: p.id || '',
   }));

   return (
      <Dialog
         fullWidth
         maxWidth="sm"
         open={open}
         onClose={handleClose}
         PaperProps={{ sx: { borderRadius: 2 } }}
      >
         <DialogTitle sx={{ pb: 2 }}>
            {currentAdjustment ? 'Edit Adjustment' : 'Add New Adjustment'}
         </DialogTitle>

         <Form methods={methods} onSubmit={onSubmit}>
            <DialogContent dividers sx={{ pt: 3, pb: 3 }}>
               <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                     <Alert severity={watchIsIncrement ? 'success' : 'warning'} sx={{ mb: 2 }}>
                        {watchIsIncrement
                           ? '✅ Stock akan BERTAMBAH (Increment)'
                           : '⚠️ Stock akan BERKURANG (Decrement)'}
                     </Alert>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                     <Field.Autocomplete
                        name="product_id"
                        label="Product"
                        options={productOptions}
                        getOptionLabel={(option) =>
                           typeof option === 'string'
                              ? productOptions.find((o) => o.value === option)?.label || option
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
                           methods.setValue('product_id', valueToSet);
                        }}
                     />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                     <Field.Text
                        name="qty"
                        label="Quantity"
                        type="number"
                        fullWidth
                        InputProps={{
                           inputProps: { min: 1 },
                        }}
                     />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                     <Field.Switch
                        name="is_increment"
                        label="Increment Stock"
                        helperText={
                           watchIsIncrement ? 'Stock akan bertambah' : 'Stock akan berkurang'
                        }
                     />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                     <Field.Text
                        multiline
                        name="description"
                        label="description / Reason"
                        minRows={3}
                        fullWidth
                        placeholder="Alasan adjustment (e.g., Stock opname, Kerusakan, dll)"
                     />
                  </Grid>
               </Grid>
            </DialogContent>

            <DialogActions>
               <Button onClick={handleClose} variant="outlined" color="inherit">
                  Cancel
               </Button>
               <Button type="submit" variant="contained" loading={isSubmitting}>
                  {currentAdjustment ? 'Update' : 'Create'}
               </Button>
            </DialogActions>
         </Form>
      </Dialog>
   );
}

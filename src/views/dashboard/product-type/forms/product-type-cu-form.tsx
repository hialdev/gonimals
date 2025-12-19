import type { ProductType } from 'src/types/product-type';

import * as z from 'zod';
import { useState } from 'react';
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
import useProductTypeStore from 'src/stores/product-type';
import { ProductTypeSchema, type ProductTypeType } from 'src/types/product-type';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { slugify } from '../helpers/slug';

// ----------------------------------------------------------------------

type Props = {
   open: boolean;
   onClose: () => void;
   onSuccess?: () => void;
   currentProductType?: ProductType;
};

export function ProductTypeCUForm({ currentProductType, open, onClose, onSuccess }: Props) {
   const { update, add } = useProductTypeStore();
   const [slug, setSlug] = useState<string>(currentProductType?.slug ?? '');

   const defaultValues: ProductTypeType = {
      title: currentProductType?.title || '',
      slug: currentProductType?.slug || '',
      image: currentProductType?.image
         ? `${CONFIG.apiHostUrl}/${currentProductType.image}`
         : undefined,
      description: currentProductType?.description || '',
   };

   const methods = useForm({
      mode: 'onSubmit',
      resolver: zodResolver(ProductTypeSchema),
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
         if (currentProductType?.id) {
            result = await update({ id: currentProductType.id, data: formData as ProductType });
         } else {
            result = await add({ data: formData as ProductType});
         }

         if (result.success) {
            toast.success(
               currentProductType
                  ? 'Product Type updated successfully!'
                  : 'Product Type created successfully!'
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

   return (
      <Dialog
         fullWidth
         maxWidth="sm"
         open={open}
         onClose={handleClose}
         PaperProps={{ sx: { borderRadius: 2 } }}
      >
         <DialogTitle sx={{ pb: 2 }}>
            {currentProductType ? 'Edit Product Type' : 'Add New Product Type'}
         </DialogTitle>

         <Form methods={methods} onSubmit={onSubmit}>
            <DialogContent dividers sx={{ pt: 3, pb: 3 }}>
               <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
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

                  <Grid size={{ xs: 12 }}>
                     <Field.Text
                        name="title"
                        label="Product Type Title"
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
                        aria-readonly
                        helperText="URL-friendly version of the title"
                     />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                     <Field.Text
                        multiline
                        name="description"
                        label="Description"
                        minRows={3}
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
                  {currentProductType ? 'Update' : 'Create'}
               </Button>
            </DialogActions>
         </Form>
      </Dialog>
   );
}

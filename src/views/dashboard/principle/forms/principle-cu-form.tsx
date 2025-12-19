import type { Principle } from 'src/types/principle';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import usePrincipleStore from 'src/stores/principle';
import { PrincipleSchema, type PrincipleFormType } from 'src/types/principle';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type Props = {
   open: boolean;
   onClose: () => void;
   onSuccess?: () => void;
   currentPrinciple?: Principle;
};

export function PrincipleCUForm({ currentPrinciple, open, onClose, onSuccess }: Props) {
   const { update, add } = usePrincipleStore();

   const defaultValues: PrincipleFormType = {
      title: currentPrinciple?.title || '',
      address: currentPrinciple?.address || '',
      pic_name: currentPrinciple?.pic_name || '',
      contact_phone: currentPrinciple?.contact_phone || '',
      contact_mail: currentPrinciple?.contact_mail || '',
   };

   const methods = useForm({
      mode: 'onSubmit',
      resolver: zodResolver(PrincipleSchema),
      defaultValues,
   });

   const {
      handleSubmit,
      formState: { isSubmitting },
      reset,
   } = methods;

   const onSubmit = handleSubmit(async (data) => {
      try {
         let result;
         if (currentPrinciple?.id) {
            result = await update({ id: currentPrinciple.id, data: data as Principle });
         } else {
            result = await add({ data: data as Principle });
         }

         if (result.success) {
            toast.success(
               currentPrinciple
                  ? 'Principle updated successfully!'
                  : 'Principle created successfully!'
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

   return (
      <Dialog
         fullWidth
         maxWidth="sm"
         open={open}
         onClose={handleClose}
         PaperProps={{ sx: { borderRadius: 2 } }}
      >
         <DialogTitle sx={{ pb: 2 }}>
            {currentPrinciple ? 'Edit Principle' : 'Add New Principle'}
         </DialogTitle>

         <Form methods={methods} onSubmit={onSubmit}>
            <DialogContent dividers sx={{ pt: 3, pb: 3 }}>
               <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                     <Field.Text name="title" label="Principle Name" fullWidth />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                     <Field.Text multiline name="address" label="Address" minRows={3} fullWidth />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                     <Field.Text name="pic_name" label="PIC Name" fullWidth />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                     <Field.Text name="contact_phone" label="Contact Phone" fullWidth />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                     <Field.Text name="contact_mail" label="Contact Email" fullWidth />
                  </Grid>
               </Grid>
            </DialogContent>

            <DialogActions>
               <Button onClick={handleClose} variant="outlined" color="inherit">
                  Cancel
               </Button>
               <Button type="submit" variant="contained" loading={isSubmitting}>
                  {currentPrinciple ? 'Update' : 'Create'}
               </Button>
            </DialogActions>
         </Form>
      </Dialog>
   );
}

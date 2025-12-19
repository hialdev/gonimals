'use client';

import type { UseSetStateReturn } from 'minimal-shared/hooks';

import { useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Autocomplete from '@mui/material/Autocomplete';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';

import useProductStore from 'src/stores/product';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type StockMovementFilters = {
   search: string;
   product_id: string;
   reference_type: string;
};

type Props = {
   onResetPage: () => void;
   filters: UseSetStateReturn<StockMovementFilters>;
};

export function StockMovementTableToolbar({ filters, onResetPage }: Props) {
   const { state: currentFilters, setState: updateFilters } = filters;
   const { products, all: getAllProducts } = useProductStore();

   useEffect(() => {
      getAllProducts({ limit: 100 });
   }, []);

   const handleFilterSearch = useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
         onResetPage();
         updateFilters({ search: event.target.value });
      },
      [onResetPage, updateFilters]
   );

   const handleFilterProduct = useCallback(
      (event: any, newValue: any) => {
         onResetPage();
         const valueToSet = typeof newValue === 'string' ? newValue : newValue?.value || '';
         updateFilters({ product_id: valueToSet });
      },
      [onResetPage, updateFilters]
   );

   const handleFilterReferenceType = useCallback(
      (event: React.ChangeEvent<{ value: unknown }>) => {
         onResetPage();
         updateFilters({ reference_type: event.target.value as string });
      },
      [onResetPage, updateFilters]
   );

   const productOptions = products.map((p) => ({
      label: `${p.product_number} - ${p.title}`,
      value: p.id || '',
   }));

   const selectedProduct =
      productOptions.find((p) => p.value === currentFilters.product_id) || null;

   return (
      <Box
         sx={{
            p: 2.5,
            gap: 2,
            display: 'flex',
            pr: { xs: 2.5, md: 1 },
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-end', md: 'center' },
         }}
      >
         <FormControl sx={{ flexShrink: 0, width: { xs: 1, md: 200 } }}>
            <InputLabel>Reference Type</InputLabel>
            <Select
               label="Reference Type"
               value={currentFilters.reference_type}
               onChange={handleFilterReferenceType as any}
            >
               <MenuItem value="">All Types</MenuItem>
               <MenuItem value="purchase">Purchase</MenuItem>
               <MenuItem value="adjustment">Adjustment</MenuItem>
               <MenuItem value="order">Order</MenuItem>
            </Select>
         </FormControl>

         <Autocomplete
            sx={{ flexShrink: 0, width: { xs: 1, md: 240 } }}
            options={productOptions}
            value={selectedProduct}
            onChange={handleFilterProduct}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            renderInput={(params) => (
               <TextField {...params} label="Filter by Product" placeholder="Select product..." />
            )}
         />

         <TextField
            fullWidth
            defaultValue={currentFilters.search}
            onBlur={handleFilterSearch}
            placeholder="Search by description..."
            slotProps={{
               input: {
                  startAdornment: (
                     <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                     </InputAdornment>
                  ),
               },
            }}
         />
      </Box>
   );
}

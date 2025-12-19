import type { SelectChangeEvent } from '@mui/material/Select';
import type { UseSetStateReturn } from 'minimal-shared/hooks';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type ProductFilters = {
   search: string;
   isActive: string;
   stockSort: string;
};

type Props = {
   onResetPage: () => void;
   filters: UseSetStateReturn<ProductFilters>;
};

export function ProductTableToolbar({ filters, onResetPage }: Props) {
   const { state: currentFilters, setState: updateFilters } = filters;

   const handleFilterSearch = useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
         onResetPage();
         updateFilters({ search: event.target.value });
      },
      [onResetPage, updateFilters]
   );

   const handleFilterStatus = useCallback(
      (event: SelectChangeEvent<string>) => {
         onResetPage();
         updateFilters({ isActive: event.target.value });
      },
      [onResetPage, updateFilters]
   );

   const handleFilterStockSort = useCallback(
      (event: SelectChangeEvent<string>) => {
         onResetPage();
         updateFilters({ stockSort: event.target.value });
      },
      [onResetPage, updateFilters]
   );

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
         <FormControl sx={{ flexShrink: 0, width: { xs: 1, md: 160 } }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={currentFilters.isActive} onChange={handleFilterStatus}>
               <MenuItem value="all">All</MenuItem>
               <MenuItem value="true">Active</MenuItem>
               <MenuItem value="false">Inactive</MenuItem>
            </Select>
         </FormControl>

         <FormControl sx={{ flexShrink: 0, width: { xs: 1, md: 180 } }}>
            <InputLabel>Stock Sort</InputLabel>
            <Select
               label="Stock Sort"
               value={currentFilters.stockSort}
               onChange={handleFilterStockSort}
            >
               <MenuItem value="">Default</MenuItem>
               <MenuItem value="lowest">Lowest Stock</MenuItem>
               <MenuItem value="highest">Highest Stock</MenuItem>
            </Select>
         </FormControl>

         <TextField
            fullWidth
            defaultValue={currentFilters.search}
            onBlur={handleFilterSearch}
            placeholder="Search by title, description, or SKU..."
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

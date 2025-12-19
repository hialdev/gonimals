import type { UseSetStateReturn } from 'minimal-shared/hooks';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type PrincipleFilters = {
   search: string;
};

type Props = {
   onResetPage: () => void;
   filters: UseSetStateReturn<PrincipleFilters>;
};

export function PrincipleTableToolbar({ filters, onResetPage }: Props) {
   const { state: currentFilters, setState: updateFilters } = filters;

   const handleFilterSearch = useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
         onResetPage();
         updateFilters({ search: event.target.value });
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
         }}
      >
         <TextField
            fullWidth
            defaultValue={currentFilters.search}
            onBlur={handleFilterSearch}
            placeholder="Search by name, PIC, or address..."
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

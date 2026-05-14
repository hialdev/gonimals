import { Button, MenuItem, MenuList } from '@mui/material';
import { usePopover } from 'minimal-shared/hooks';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';
import { exportToCSV, exportToExcel } from 'src/utils/export-data';

// ----------------------------------------------------------------------

type Props = {
   data?: any[];
   filename?: string;
   onExport?: (format: 'excel' | 'csv') => void;
};

export function ExportButton({ data, filename, onExport }: Props) {
   const popover = usePopover();

   const handleExportExcel = () => {
      if (onExport) {
         onExport('excel');
      } else if (data && filename) {
         exportToExcel(data, filename);
      }
      popover.onClose();
   };

   const handleExportCSV = () => {
      if (onExport) {
         onExport('csv');
      } else if (data && filename) {
         exportToCSV(data, filename);
      }
      popover.onClose();
   };

   return (
      <>
         <Button
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="eva:cloud-download-fill" />}
            onClick={popover.onOpen}
         >
            Export
         </Button>

         <CustomPopover
            open={popover.open}
            anchorEl={popover.anchorEl}
            onClose={popover.onClose}
            slotProps={{ arrow: { placement: 'top-right' } }}
         >
            <MenuList>
               <MenuItem onClick={handleExportExcel}>
                  <Iconify icon="vscode-icons:file-type-excel" />
                  Export as Excel
               </MenuItem>

               <MenuItem onClick={handleExportCSV}>
                  <Iconify icon="vscode-icons:file-type-text" />
                  Export as CSV
               </MenuItem>
            </MenuList>
         </CustomPopover>
      </>
   );
}

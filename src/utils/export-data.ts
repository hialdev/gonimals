import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string) => {
   if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
   }
   const worksheet = XLSX.utils.json_to_sheet(data);
   const workbook = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
   XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const exportToCSV = (data: any[], fileName: string) => {
   if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
   }
   const worksheet = XLSX.utils.json_to_sheet(data);
   const workbook = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
   XLSX.writeFile(workbook, `${fileName}.csv`, { bookType: 'csv' });
};

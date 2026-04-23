import * as XLSX from 'xlsx';
import { Transaction } from '../types';
import { format } from 'date-fns';

export const exportTransactionsToExcel = (transactions: Transaction[]) => {
  const data = transactions.map(t => ({
    'Date': t.date?.toDate ? format(t.date.toDate(), 'yyyy-MM-dd HH:mm') : t.date,
    'Type': t.type.toUpperCase(),
    'Category': t.category,
    'Amount': t.amount,
    'Status': t.status.toUpperCase(),
    'Payment Method': t.paymentMethod,
    'Donation Type': t.donationType || 'N/A',
    'Expenditure Type': t.expenditureType || 'N/A',
    'Project ID': t.projectID || 'N/A',
    'Created By (UID)': t.createdBy
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

  // Excel formatting hints could be added here if needed
  
  XLSX.writeFile(workbook, 'NGO_Financial_Report.xlsx');
};

import * as XLSX from 'xlsx';
import { Transaction, Donor } from '../types';
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

export const exportDonorsToExcel = (donors: Donor[]) => {
  const data = donors.map(d => ({
    'Name': d.name,
    'Email': d.email,
    'Total Donated': d.total_donated,
    'Tier': d.tier,
    'Frequency': d.frequency,
    'Engagement Date': d.join_date?.toDate ? format(d.join_date.toDate(), 'yyyy-MM-dd') : d.join_date,
    'Last Interaction': d.last_donation_date?.toDate ? format(d.last_donation_date.toDate(), 'yyyy-MM-dd') : d.last_donation_date
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Donors');
  XLSX.writeFile(workbook, 'NGO_Donor_CRM.xlsx');
};

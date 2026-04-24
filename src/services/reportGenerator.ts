import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Project, BudgetItem, Transaction } from '../types';
import { format } from 'date-fns';

export const generateProjectImpactReport = (project: Project, budgetItems: BudgetItem[], transactions: Transaction[]) => {
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Branding Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('IMPACT REPORT', 15, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`NGO DATA VINE | GENERATED ON ${format(new Date(), 'PPP')}`, 15, 30);

  // Project Info
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(project.name.toUpperCase(), 15, 55);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Status: ${project.status.replace('_', ' ').toUpperCase()}`, 15, 62);
  doc.text(`Department: ${project.department}`, 15, 67);
  doc.text(`Lead Name: ${project.lead_name}`, 15, 72);
  doc.text(`Context: ${project.description || 'N/A'}`, 15, 77);

  // Summary Grid
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(15, 85, pageWidth - 30, 30, 3, 3, 'F');
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.text('TOTAL REVENUE', 25, 95);
  doc.setFontSize(14);
  doc.text(project.budget || 'N/A', 25, 105);

  doc.setFontSize(10);
  doc.text('PROGRESS DELTA', 100, 95);
  doc.setFontSize(14);
  doc.text(`${project.progress}%`, 100, 105);

  // Budget Breakdown Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('BUDGET ALLOCATION (PROPOSED)', 15, 130);

  const budgetRows = budgetItems.map(item => [item.item, `INR ${item.cost.toLocaleString()}`]);
  
  doc.autoTable({
    startY: 135,
    head: [['Description', 'Allocated Amount']],
    body: budgetRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42] },
    margin: { left: 15, right: 15 }
  });

  // Financial Integrity Table
  const finalY = doc.lastAutoTable.finalY || 130;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('REAL-TIME EXPENDITURE (ACTUAL)', 15, finalY + 20);

  const expenseRows = transactions
    .filter(t => t.type === 'expense')
    .map(t => [
      t.date?.toDate ? format(t.date.toDate(), 'PP') : 'N/A', 
      t.category, 
      t.description || 'No description', 
      `INR ${t.amount.toLocaleString()}`
    ]);

  doc.autoTable({
    startY: finalY + 25,
    head: [['Date', 'Category', 'Description', 'Actual Cost']],
    body: expenseRows,
    theme: 'grid',
    headStyles: { fillColor: [220, 38, 38] }, // red-600
    margin: { left: 15, right: 15 }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount} | Confidential NGO Financial Report`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  doc.save(`${project.name}_Impact_Report.pdf`);
};

import { jsPDF } from 'jspdf';
import { Volunteer, Project } from '../types';
import { format } from 'date-fns';

export const generateVolunteerCertificate = (volunteer: Volunteer, project: Project) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- Background Decor ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 15, pageHeight, 'F'); // Left border
  
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(15, 0, pageWidth - 15, pageHeight, 'F');

  // --- Content ---
  doc.setTextColor(15, 23, 42);
  
  // Header
  doc.setFont('times', 'bold');
  doc.setFontSize(40);
  doc.text('CERTIFICATE', pageWidth / 2 + 7.5, 45, { align: 'center' });
  
  doc.setFontSize(20);
  doc.setFont('times', 'italic');
  doc.text('OF APPRECIATION', pageWidth / 2 + 7.5, 55, { align: 'center' });

  // Divider
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 40, 65, pageWidth / 2 + 55, 65);

  // Body
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text('THIS CERTIFICATE IS PROUDLY PRESENTED TO', pageWidth / 2 + 7.5, 85, { align: 'center' });

  doc.setFont('times', 'bolditalic');
  doc.setFontSize(32);
  doc.text(volunteer.name, pageWidth / 2 + 7.5, 105, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text('FOR THEIR OUTSTANDING VOLUNTARY CONTRIBUTION TO THE PROJECT', pageWidth / 2 + 7.5, 125, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(project.name.toUpperCase(), pageWidth / 2 + 7.5, 138, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const contributionText = `By dedicating their time, skills, and passion, ${volunteer.name} has played a vital role in our mission. Their commitment to social impact is an inspiration to us all.`;
  const splitText = doc.splitTextToSize(contributionText, 160);
  doc.text(splitText, pageWidth / 2 + 7.5, 155, { align: 'center' });

  // Footer / Signatures
  doc.setFontSize(10);
  doc.text(`Issued on: ${format(new Date(), 'PPP')}`, 40, 185);

  // Admin Signature Line
  doc.line(180, 185, 250, 185);
  doc.setFont('times', 'italic');
  doc.text('Executive Director', 215, 192, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.text('HOPE NGO INDIA', 215, 182, { align: 'center' });

  // Badge/Stamp (Graphic circle)
  doc.setDrawColor(245, 158, 11); // amber-500
  doc.setLineWidth(1.5);
  doc.circle(pageWidth / 2 + 7.5, 180, 10, 'S');
  doc.setFontSize(8);
  doc.text('CERTIFIED', pageWidth / 2 + 7.5, 181, { align: 'center' });

  const fileName = `Certificate_${volunteer.name.replace(/\s+/g, '_')}_${project.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
  
  return fileName;
};

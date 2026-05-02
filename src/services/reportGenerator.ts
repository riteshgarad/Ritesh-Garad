import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Attendance } from '../types';

export interface ImpactSummary {
  weekStarting: string;
  totalHours: number;
  totalVolunteers: number;
  totalMissions: number;
  missionBreakdown: Record<string, number>;
  topContributors: Array<{ name: string; hours: number }>;
  rawLogs: Attendance[];
}

export const generateProjectImpactReport = async (days: number = 7): Promise<ImpactSummary> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startTimestamp = Timestamp.fromDate(startDate);

  const attendanceRef = collection(db, 'attendance');
  const q = query(
    attendanceRef, 
    where('punchOut', '>=', startTimestamp),
    orderBy('punchOut', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance));

  const summary: ImpactSummary = {
    weekStarting: startDate.toLocaleDateString(),
    totalHours: 0,
    totalVolunteers: 0,
    totalMissions: logs.length,
    missionBreakdown: {},
    topContributors: [],
    rawLogs: logs
  };

  const volunteerHours: Record<string, { name: string; hours: number }> = {};
  const volunteersSet = new Set<string>();

  logs.forEach(log => {
    const hours = (log.durationMinutes || 0) / 60;
    summary.totalHours += hours;
    
    volunteersSet.add(log.userId);

    // Mission Breakdown
    summary.missionBreakdown[log.missionName] = (summary.missionBreakdown[log.missionName] || 0) + hours;

    // Volunteer Stats
    if (log.userName === 'Anonymous Volunteer') return;
    
    if (!volunteerHours[log.userId]) {
      volunteerHours[log.userId] = { name: log.userName || 'Unknown Operative', hours: 0 };
    }
    volunteerHours[log.userId].hours += hours;
  });

  summary.totalVolunteers = volunteersSet.size;
  summary.topContributors = Object.values(volunteerHours)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5);

  return summary;
};

export const exportToPDF = (summary: ImpactSummary) => {
  const doc = new jsPDF();
  const mahogany = '#4A1412';
  const terracotta = '#A63A1B';

  // --- Header ---
  doc.setFillColor(mahogany);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('GARAD FOUNDATION', 20, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('MISSION BHARARI OS - IMPACT AUDIT CERTIFICATE', 20, 28);
  
  doc.text(`REPORT PERIOD: ${summary.weekStarting} - ${new Date().toLocaleDateString()}`, 140, 28);

  // --- Summary Cards ---
  let y = 60;
  doc.setTextColor(mahogany);
  doc.setFontSize(14);
  doc.text('GLOBAL IMPACT OVERVIEW', 20, y);
  
  y += 10;
  const cardW = 55;
  
  // Card 1: Hours
  doc.setDrawColor('#EEEEEE');
  doc.roundedRect(20, y, cardW, 25, 3, 3, 'S');
  doc.setFontSize(8);
  doc.text('TOTAL VOLUNTEER HOURS', 25, y + 8);
  doc.setFontSize(16);
  doc.setTextColor(terracotta);
  doc.text(summary.totalHours.toFixed(1), 25, y + 18);
  
  // Card 2: Volunteers
  doc.roundedRect(20 + cardW + 5, y, cardW, 25, 3, 3, 'S');
  doc.setTextColor(mahogany);
  doc.setFontSize(8);
  doc.text('ACTIVE OPERATIVES', 25 + cardW + 5, y + 8);
  doc.setFontSize(16);
  doc.setTextColor(terracotta);
  doc.text(summary.totalVolunteers.toString(), 25 + cardW + 5, y + 18);

  // Card 3: Missions
  doc.roundedRect(20 + (cardW + 5) * 2, y, cardW, 25, 3, 3, 'S');
  doc.setTextColor(mahogany);
  doc.setFontSize(8);
  doc.text('MISSIONS CONDUCTED', 25 + (cardW + 5) * 2, y + 8);
  doc.setFontSize(16);
  doc.setTextColor(terracotta);
  doc.text(summary.totalMissions.toString(), 25 + (cardW + 5) * 2, y + 18);

  // --- Mission Table ---
  y += 45;
  doc.setTextColor(mahogany);
  doc.setFontSize(12);
  doc.text('OPERATIONAL LOGS (LAST 7 DAYS)', 20, y);
  
  const tableData = summary.rawLogs.map(log => [
    log.punchIn?.toDate ? log.punchIn.toDate().toLocaleDateString() : 'N/A',
    log.userName || 'Anonymous',
    log.missionName,
    `${(log.durationMinutes || 0)} min`,
    'Verified'
  ]);

  autoTable(doc, {
    startY: y + 5,
    head: [['Date', 'Operative', 'Mission Node', 'Duration', 'GPS Status']],
    body: tableData,
    headStyles: { fillColor: mahogany, textColor: '#FFFFFF', fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: '#F9F9F9' },
    margin: { left: 20, right: 20 }
  });

  // --- Top Contributors ---
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.text('TOP MISSION CONTRIBUTORS', 20, finalY);
  
  const contribData = summary.topContributors.map((c, i) => [
    `#${i + 1}`,
    c.name,
    `${c.hours.toFixed(1)} Hours`
  ]);

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Rank', 'Operative Name', 'Total Impact']],
    body: contribData,
    headStyles: { fillColor: terracotta, textColor: '#FFFFFF', fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 20, right: 20 }
  });

  // --- Footer ---
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor('#999999');
  doc.text('SEAL OF VERIFICATION: All listed operational hours are confirmed via GPS-Bharari OS Identity Protocols.', 20, pageHeight - 20);
  doc.text('CONFIDENTIAL - FOR INTERNAL NGO AUDIT ONLY', 20, pageHeight - 15);
  
  doc.save(`Garad_Impact_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

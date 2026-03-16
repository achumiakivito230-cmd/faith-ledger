import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Offering } from '@/types';

export function generateMonthlyPDF(
  offerings: Offering[],
  monthName: string,
  year: number,
  treasurerName: string,
  churchName: string = 'Church'
) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${churchName} — Treasury Report`, 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${monthName} ${year}`, 105, 28, { align: 'center' });

  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 33, 190, 33);

  // Table
  const verified = offerings.filter((o) => o.status === 'verified');
  const tableData = verified.map((o) => [
    format(new Date(o.date), 'MMM d, yyyy'),
    `₹${Number(o.total_amount).toLocaleString('en-IN')}`,
    o.status === 'verified' ? '✓ Verified' : 'Pending',
  ]);

  autoTable(doc, {
    startY: 38,
    head: [['Date', 'Amount', 'Status']],
    body: tableData,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      1: { halign: 'right', fontStyle: 'bold' },
    },
  });

  // Summary
  const total = verified.reduce((s, o) => s + Number(o.total_amount), 0);
  const avg = verified.length > 0 ? total / verified.length : 0;
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 100;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY', 20, finalY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Total Offerings: ₹${total.toLocaleString('en-IN')}`, 20, finalY + 24);
  doc.text(`Services Recorded: ${verified.length}`, 20, finalY + 31);
  doc.text(`Average per Service: ₹${Math.round(avg).toLocaleString('en-IN')}`, 20, finalY + 38);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')} | Report by: ${treasurerName}`, 105, 285, { align: 'center' });

  doc.save(`Treasury_Report_${monthName}_${year}.pdf`);
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { 
  TestCase, RegressionCycle, ExecutionResult, 
  Bug, User, Statistics 
} from '../types';

interface ExportData {
  cycle: RegressionCycle | null;
  testCases: TestCase[];
  results: ExecutionResult[];
  bugs: Bug[];
  users: User[];
  stats: Statistics;
}

export const exportCycleReport = (data: ExportData) => {
  const { cycle, testCases, results, bugs, users, stats } = data;
  if (!cycle) return;

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const dateStr = format(new Date(), 'PPP p');

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('REGRESSION CYCLE REPORT', 15, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: TestFlow PRO Enterprise API`, 15, 26);
  doc.text(`Generated: ${dateStr}`, 15, 31);

  // Cycle Info
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Cycle Information', 15, 55);

  autoTable(doc, {
    startY: 60,
    head: [['Field', 'Value']],
    body: [
      ['Cycle ID', cycle.id],
      ['Name', cycle.name],
      ['Version', cycle.version],
      ['Status', cycle.status],
      ['Owner/Lead', users.find(u => u.id === cycle.ownerId)?.name || 'N/A'],
      ['Start Date', cycle.startDate ? format(new Date(cycle.startDate), 'PPP') : 'N/A'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [51, 65, 85] },
    styles: { fontSize: 10 }
  });

  // Statistics Summary
  const finalY = (doc as any).lastAutoTable.finalY || 60;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Execution Statistics', 15, finalY + 15);

  autoTable(doc, {
    startY: finalY + 20,
    head: [['Metric', 'Count', 'Percentage']],
    body: [
      ['Total Test Cases', stats.total.toString(), '100%'],
      ['Passed', stats.passed.toString(), `${Math.round((stats.passed / stats.total) * 100)}%`],
      ['Failed', stats.failed.toString(), `${Math.round((stats.failed / stats.total) * 100)}%`],
      ['Blocked', stats.blocked.toString(), `${Math.round((stats.blocked / stats.total) * 100)}%`],
      ['Not Run', stats.notRun.toString(), `${Math.round((stats.notRun / stats.total) * 100)}%`],
      ['Pass Rate (Execution)', `${stats.passRate}%`, '-'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] }, // indigo-600
    styles: { fontSize: 10, halign: 'center' },
    columnStyles: { 0: { halign: 'left' } }
  });

  // Bug Summary
  const statsY = (doc as any).lastAutoTable.finalY || finalY + 20;
  doc.text('Issues Summary', 15, statsY + 15);

  autoTable(doc, {
    startY: statsY + 20,
    head: [['Metric', 'Value']],
    body: [
      ['Total Defects Found', stats.totalBugs.toString()],
      ['Active Defects', stats.activeBugs.toString()],
      ['Reopened Issues', stats.reopenedBugs.toString()],
    ],
    theme: 'striped',
    headStyles: { fillColor: [225, 29, 72] }, // rose-600
    styles: { fontSize: 10 }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 25, doc.internal.pageSize.getHeight() - 10);
    doc.text('TestFlow PRO - Confidential Enterprise Quality Report', 15, doc.internal.pageSize.getHeight() - 10);
  }

  doc.save(`Cycle_Report_${cycle.id}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportExecutionReport = (data: ExportData) => {
  const { cycle, testCases, results, users } = data;
  if (!cycle) return;

  const doc = new jsPDF({
    orientation: 'l',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('TEST EXECUTION DETAIL REPORT', 15, 15);
  doc.setFontSize(10);
  doc.text(`Cycle: ${cycle.name} (${cycle.id}) | Version: ${cycle.version}`, 15, 22);

  const tableData = testCases.map(tc => {
    const result = results.find(r => r.testCaseId === tc.id);
    return [
      tc.id,
      tc.module,
      tc.title,
      users.find(u => u.id === result?.testerId)?.name || 'N/A',
      result?.status || 'Not Run',
      result?.executionDate ? format(new Date(result.executionDate), 'yyyy-MM-dd') : 'N/A',
      result?.remarks || ''
    ];
  });

  autoTable(doc, {
    startY: 40,
    head: [['ID', 'Module', 'Title', 'Tester', 'Status', 'Date', 'Remarks']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [51, 65, 85] },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 25 },
      2: { cellWidth: 70 },
      3: { cellWidth: 30 },
      4: { cellWidth: 20 },
      5: { cellWidth: 25 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const val = data.cell.raw;
        if (val === 'Pass') data.cell.styles.textColor = [5, 150, 105];
        if (val === 'Fail') data.cell.styles.textColor = [220, 38, 38];
        if (val === 'Blocked') data.cell.styles.textColor = [217, 119, 6];
      }
    }
  });

  doc.save(`Execution_Report_${cycle.id}.pdf`);
};

export const exportBugReport = (data: ExportData) => {
  const { cycle, bugs, users } = data;
  if (!cycle) return;

  const doc = new jsPDF({
    orientation: 'l',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('BUG SUMMARY REPORT', 15, 15);
  doc.setFontSize(10);
  doc.text(`Cycle: ${cycle.name} (${cycle.id})`, 15, 22);

  const cycleBugs = bugs.filter(b => b.cycleId === cycle.id);

  const tableData = cycleBugs.map(b => [
    b.id,
    b.title,
    b.severity,
    b.status,
    users.find(u => u.id === b.assigneeId)?.name || 'Unassigned',
    b.reopenCount.toString(),
    format(new Date(b.createdAt), 'yyyy-MM-dd')
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Bug ID', 'Title', 'Severity', 'Status', 'Assignee', 'Reopens', 'Created']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [225, 29, 72] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 80 },
      2: { cellWidth: 20 },
      3: { cellWidth: 25 },
      4: { cellWidth: 35 },
      5: { cellWidth: 20 },
    }
  });

  doc.save(`Bug_Report_${cycle.id}.pdf`);
};

export const exportOverallSummary = async (
  cycles: RegressionCycle[],
  users: User[],
  bugs: Bug[],
  testCases: TestCase[],
  results: ExecutionResult[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const dateStr = format(new Date(), 'PPP p');

  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('VibeQA Overall Analytics Summary', 20, 25);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${dateStr}`, pageWidth - 20, 32, { align: 'right' });

  // Executive Summary Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, 50, pageWidth - 40, 40, 3, 3, 'F');
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 30, 65);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text([
    `This report provides a consolidated view of QA performance across ${cycles.length} regression cycles.`,
    `Total Test Cases: ${testCases.length} | Overall Bugs Reported: ${bugs.length}`,
    `Active Defects: ${bugs.filter(b => b.status !== 'Done').length} | Reopened Defects: ${bugs.filter(b => b.reopenCount > 0).length}`
  ], 30, 75);

  // Statistics Table
  const tableData = cycles.map(cycle => {
    const cycleResults = results.filter(r => r.cycleId === cycle.id);
    const pass = cycleResults.filter(r => r.status === 'Pass').length;
    const fail = cycleResults.filter(r => r.status === 'Fail').length;
    const block = cycleResults.filter(r => r.status === 'Blocked').length;
    const cycleBugs = bugs.filter(b => b.cycleId === cycle.id);
    const passRate = cycleResults.length > 0 ? Math.round((pass / cycleResults.length) * 100) : 0;

    return [
      cycle.id,
      cycle.version,
      cycle.status,
      pass,
      fail,
      block,
      `${passRate}%`,
      cycleBugs.length
    ];
  });

  autoTable(doc, {
    startY: 100,
    head: [['ID', 'Version', 'Status', 'Pass', 'Fail', 'Block', 'Pass %', 'Bugs']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] },
  });

  // Footer / Page Numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  doc.save(`VibeQA_Overall_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};

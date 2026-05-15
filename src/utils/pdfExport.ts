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
  doc.setFillColor(79, 70, 229); // Indigo-600
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('REGRESSION CYCLE REPORT', 15, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`VibeQA Quality Pulse Management`, 15, 26);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: TestFlow PRO Enterprise API`, 15, 26);
  doc.text(`Generated: ${dateStr}`, 15, 31);

  // Cycle Info
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Cycle Information', 15, 55);
  // Section: Cycle Information
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.text('I. CYCLE METADATA', 15, 55);

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
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  // Statistics Summary
  // Section: Statistics Summary
  const finalY = (doc as any).lastAutoTable.finalY || 60;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Execution Statistics', 15, finalY + 15);
  doc.setFontSize(12);
  doc.text('II. EXECUTION ANALYTICS', 15, finalY + 15);

  autoTable(doc, {
    startY: finalY + 20,
    head: [['Metric', 'Count', 'Coverage / Rate']],
    body: [
      ['Total Test Cases', stats.total.toString(), '100%'],
      ['Passed', stats.passed.toString(), `${Math.round((stats.passed / stats.total) * 100)}%`],
      ['Failed', stats.failed.toString(), `${Math.round((stats.failed / stats.total) * 100)}%`],
      ['Blocked', stats.blocked.toString(), `${Math.round((stats.blocked / stats.total) * 100)}%`],
      ['Not Run', stats.notRun.toString(), `${Math.round((stats.notRun / stats.total) * 100)}%`],
      ['Pass Rate (Execution)', `${stats.passRate}%`, '-'],
      ['Passed', stats.passed.toString(), `${stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0}%`],
      ['Failed', stats.failed.toString(), `${stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0}%`],
      ['Blocked', stats.blocked.toString(), `${stats.total > 0 ? Math.round((stats.blocked / stats.total) * 100) : 0}%`],
      ['Not Run', stats.notRun.toString(), `${stats.total > 0 ? Math.round((stats.notRun / stats.total) * 100) : 0}%`],
      ['Pass Rate (Success)', `${stats.passRate}%`, 'Global Benchmark'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], halign: 'center' },
    styles: { fontSize: 9, halign: 'center', cellPadding: 3 },
    columnStyles: { 0: { halign: 'left' } }
  });

  // Bug Summary
  // Section: Bug Summary
  const statsY = (doc as any).lastAutoTable.finalY || finalY + 20;
  doc.text('Issues Summary', 15, statsY + 15);
  doc.text('III. DEFECT TRACKING', 15, statsY + 15);

  autoTable(doc, {
    startY: statsY + 20,
    head: [['Metric', 'Value']],
    body: [
      ['Total Defects Found', stats.totalBugs.toString()],
      ['Active Defects', stats.activeBugs.toString()],
      ['Reopened Issues', stats.reopenedBugs.toString()],
    ],
    theme: 'striped',
    headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255] },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 25, doc.internal.pageSize.getHeight() - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
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
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('TEST EXECUTION DETAIL REPORT', 15, 15);
  doc.setFontSize(10);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTION TRACEABILITY REPORT', 15, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
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
    styles: { fontSize: 7, cellPadding: 2.5 },
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] },
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
  doc.setFillColor(225, 29, 72); // Rose-600
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('BUG SUMMARY REPORT', 15, 15);
  doc.setFontSize(10);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
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
    styles: { fontSize: 7, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
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
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'l' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const dateStr = format(new Date(), 'PPP p');

  const totalCycles = cycles.length;
  const totalTestCases = testCases.length;

  // Get latest unique execution results across all cycles to calculate overall metrics correctly
  const latestResultsMap = results.reduce((map, r) => {
    const key = `${r.cycleId}-${r.testCaseId}`;
    const existing = map.get(key);
    if (!existing || new Date(r.updatedAt) > new Date(existing.updatedAt)) {
      map.set(key, r);
    }
    return map;
  }, new Map<string, ExecutionResult>());

  const uniqueResults = Array.from(latestResultsMap.values());
  const totalExecutions = uniqueResults.length;
  const passedExecutions = uniqueResults.filter(r => r.status === 'Pass').length;
  const overallPassRate = totalExecutions > 0 ? Math.round((passedExecutions / totalExecutions) * 100) : 0;
  const totalBugs = bugs.length;
  const activeBugs = bugs.filter(b => b.status !== 'Done').length;
  const reopenedBugs = bugs.filter(b => b.reopenCount > 0).length;
  const executionCoverage = totalTestCases > 0 ? Math.round((totalExecutions / totalTestCases) * 100) : 0;

  doc.setFillColor(15, 20, 40);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('VibeQA Cycle Summary', margin, 24);

  doc.setFontSize(14);
  doc.setTextColor(226, 232, 240);
  doc.text(`Generated: ${dateStr}`, pageWidth - margin, 24, { align: 'right' });

  const headerTable = [
    ['Cycles', totalCycles.toString()],
    ['Test Cases', totalTestCases.toString()],
    ['Executions', totalExecutions.toString()],
    ['Pass Rate', `${overallPassRate}%`],
    ['Execution Coverage', `${executionCoverage}%`],
    ['Total Bugs', totalBugs.toString()],
    ['Active Bugs', activeBugs.toString()],
    ['Reopened', reopenedBugs.toString()]
  ];

  autoTable(doc, {
    startY: 50,
    margin: { left: margin, right: margin },
    theme: 'striped',
    tableWidth: contentWidth,
    head: [['Metric', 'Value']],
    body: headerTable,
    headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42] },
    styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
    columnStyles: { 0: { cellWidth: 55, halign: 'left' }, 1: { cellWidth: contentWidth - 55, halign: 'left' } }
  });

  const tableStartY = (doc as any).lastAutoTable.finalY + 10;

  const tableData = cycles.map(cycle => {
    // Optimized calculation to handle duplicate execution results by selecting the latest per test case
    const cycleResults = results.filter(r => r.cycleId === cycle.id);
    
    const latestCycleResultsMap = cycleResults.reduce((map, r) => {
      const existing = map.get(r.testCaseId);
      if (!existing || new Date(r.updatedAt) > new Date(existing.updatedAt)) {
        map.set(r.testCaseId, r);
      }
      return map;
    }, new Map<string, ExecutionResult>());

    const uniqueResults = Array.from(latestCycleResultsMap.values());
    const executed = uniqueResults.length;
    const passed = uniqueResults.filter(r => r.status === 'Pass').length;
    const passRate = executed > 0 ? Math.round((passed / executed) * 100) : 0;
    const coverage = totalTestCases > 0 ? Math.round((executed / totalTestCases) * 100) : 0;
    const cycleBugs = bugs.filter(b => b.cycleId === cycle.id);
    const activeCycleBugs = cycleBugs.filter(b => b.status !== 'Done').length;

    return [
      cycle.id,
      cycle.version || 'N/A',
      cycle.status,
      executed.toString(),
      `${passRate}%`,
      `${coverage}%`,
      cycleBugs.length.toString(),
      activeCycleBugs.toString(),
      cycle.ownerId ? (users.find(u => u.id === cycle.ownerId)?.name || 'N/A') : 'N/A'
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    tableWidth: contentWidth,
    head: [['Cycle', 'Version', 'Status', 'Executed', 'Pass %', 'Coverage', 'Bugs', 'Active Bugs', 'Owner']],
    body: tableData,
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], halign: 'center' },
    bodyStyles: { halign: 'center', textColor: [30, 41, 59] },
    styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      0: { halign: 'left', cellWidth: 34 },
      1: { halign: 'left', cellWidth: 26 },
      2: { halign: 'left', cellWidth: 26 },
      3: { halign: 'center', cellWidth: 30 },
      4: { halign: 'center', cellWidth: 30 },
      5: { halign: 'center', cellWidth: 30 },
      6: { halign: 'center', cellWidth: 30 },
      7: { halign: 'center', cellWidth: 30 },
      8: { halign: 'left', cellWidth: 30 }
    }
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(113, 128, 150);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  doc.save(`VibeQA_Cycle_Summary_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};

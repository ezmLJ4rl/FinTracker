import { Transaction, EfficiencyScore, DashboardStats, Profile, UserSettings } from '../types';
import jsPDF from 'jspdf';

export function calculateEfficiencyScore(
  transactions: Transaction[],
  profile: Profile
): EfficiencyScore {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const totalBnpl = transactions.filter(t => t.type === 'bnpl').reduce((acc, t) => acc + t.amount, 0);
  const allOutflows = totalExpense + totalBnpl;

  const netSavings = totalIncome - allOutflows;
  const savingsRate = totalIncome > 0 ? Math.max(0, (netSavings / totalIncome) * 100) : 0;

  // Fixed vs Variable calculation
  const fixedExpenses = transactions
    .filter(t => (t.type === 'expense' || t.type === 'bnpl') && t.isFixedCost)
    .reduce((acc, t) => acc + t.amount, 0);
  const variableExpenses = allOutflows - fixedExpenses;

  const fixedCostPct = allOutflows > 0 ? (fixedExpenses / allOutflows) * 100 : 0;
  const variableCostPct = allOutflows > 0 ? (variableExpenses / allOutflows) * 100 : 0;
  const bnplBurdenPct = allOutflows > 0 ? (totalBnpl / allOutflows) * 100 : 0;

  // Budget discipline (max 30 pts)
  const monthlyBudget = profile.monthlyBudget || 1500000;
  const budgetUtilizationPct = monthlyBudget > 0 ? (allOutflows / monthlyBudget) * 100 : 0;
  let budgetDiscipline = 30;
  if (budgetUtilizationPct > 100) {
    budgetDiscipline = Math.max(0, 30 - (budgetUtilizationPct - 100) * 0.8);
  } else if (budgetUtilizationPct > 85) {
    budgetDiscipline = 25;
  } else {
    budgetDiscipline = 30;
  }

  // Savings health (max 30 pts)
  let savingsHealth = 0;
  if (savingsRate >= 30) savingsHealth = 30;
  else if (savingsRate >= 20) savingsHealth = 26;
  else if (savingsRate >= 10) savingsHealth = 18;
  else if (savingsRate > 0) savingsHealth = 10;
  else savingsHealth = 2;

  // Debt & BNPL Risk (max 20 pts)
  let debtAndBnplRisk = 20;
  if (bnplBurdenPct > 35) debtAndBnplRisk = 5;
  else if (bnplBurdenPct > 20) debtAndBnplRisk = 11;
  else if (bnplBurdenPct > 10) debtAndBnplRisk = 16;
  else debtAndBnplRisk = 20;

  // Cash flow stability (max 20 pts)
  let cashFlowStability = 20;
  if (totalIncome === 0 && allOutflows > 0) cashFlowStability = 4;
  else if (netSavings < 0) cashFlowStability = 8;
  else if (fixedCostPct > 70) cashFlowStability = 13; // Too rigid
  else cashFlowStability = 20;

  const totalScore = Math.min(100, Math.max(0, Math.round(budgetDiscipline + savingsHealth + debtAndBnplRisk + cashFlowStability)));

  let grade: EfficiencyScore['grade'] = 'C';
  let title = 'Fair Financial Health';

  if (totalScore >= 92) {
    grade = 'A+';
    title = 'Exceptional Financial Efficiency';
  } else if (totalScore >= 82) {
    grade = 'A';
    title = 'Robust Financial Health';
  } else if (totalScore >= 70) {
    grade = 'B';
    title = 'Solid Budget Adherence';
  } else if (totalScore >= 55) {
    grade = 'C';
    title = 'Moderate Fiscal Efficiency';
  } else if (totalScore >= 40) {
    grade = 'D';
    title = 'Vulnerable Budget Stress';
  } else {
    grade = 'F';
    title = 'Critical Cash Flow Alert';
  }

  // Projected runway days
  const averageDailySpend = allOutflows > 0 ? allOutflows / 30 : 1;
  const projectedRunwayDays = netSavings > 0 ? Math.round(netSavings / averageDailySpend) : 0;

  const keyRecommendations: string[] = [];
  if (savingsRate < 15) keyRecommendations.push('Elevate automated monthly savings to achieve the 20% milestone.');
  if (totalBnpl > 0) keyRecommendations.push(`Accelerate liquidation of active BNPL installments to eliminate recurring interest or late risks.`);
  if (variableCostPct > 55) keyRecommendations.push('Discretionary variable expenditures exceed 55% of total outlays; consider weekly category caps.');
  if (budgetUtilizationPct > 90) keyRecommendations.push('Approaching monthly budget ceiling; restrict non-essential purchases for the remainder of the cycle.');
  if (keyRecommendations.length === 0) keyRecommendations.push('Maintain current financial discipline and consider reinvesting surplus cash flow.');

  return {
    score: totalScore,
    grade,
    title,
    savingsRate,
    budgetUtilizationPct,
    fixedCostPct,
    variableCostPct,
    bnplBurdenPct,
    projectedRunwayDays,
    breakdown: {
      budgetDiscipline: Math.round(budgetDiscipline),
      savingsHealth: Math.round(savingsHealth),
      debtAndBnplRisk: Math.round(debtAndBnplRisk),
      cashFlowStability: Math.round(cashFlowStability),
    },
    keyRecommendations,
  };
}

export function computeDashboardStats(
  transactions: Transaction[],
  profile: Profile
): DashboardStats {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const totalBnpl = transactions.filter(t => t.type === 'bnpl').reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - (totalExpense + totalBnpl);
  const allOutflows = totalExpense + totalBnpl;

  const monthlyBudget = profile.monthlyBudget || 1500000;
  const budgetRemaining = Math.max(0, monthlyBudget - allOutflows);
  const budgetUsedPercent = monthlyBudget > 0 ? Math.min(100, Math.round((allOutflows / monthlyBudget) * 100)) : 0;
  const savingsRate = totalIncome > 0 ? Math.max(0, (netBalance / totalIncome) * 100) : 0;

  const efficiencyScore = calculateEfficiencyScore(transactions, profile);

  return {
    netBalance,
    totalIncome,
    totalExpense,
    totalExpenses: totalExpense,
    totalBnplDebt: totalBnpl,
    savingsRate,
    budgetRemaining,
    budgetUsedPercent,
    transactionCount: transactions.length,
    efficiencyScore,
  };
}

/**
 * Generates an institutional-grade PDF Financial Audit Report using jsPDF
 */
export function exportFinancialAuditPDF(
  transactions: Transaction[],
  profile: Profile,
  currencySymbol: string,
  stats: DashboardStats,
  username: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FinTrack Pro', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Personal Finance Auditing & Wealth Management Platform', 14, 26);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString()}`, 14, 33);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Profile: ${profile.name} (${username})`, pageWidth - 14, 22, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Currency: ${currencySymbol}`, pageWidth - 14, 30, { align: 'right' });

  // Summary Metrics Section
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Executive Financial Summary', 14, 52);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 56, pageWidth - 28, 36, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL INFLOW (INCOME)', 20, 64);
  doc.text('TOTAL OUTFLOW (EXPENSES)', 75, 64);
  doc.text('NET SURPLUS / BALANCE', 130, 64);
  doc.text('EFFICIENCY RATING', 170, 64);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Green
  doc.text(`${currencySymbol} ${stats.totalIncome.toLocaleString()}`, 20, 74);

  doc.setTextColor(239, 68, 68); // Red
  doc.text(`${currencySymbol} ${(stats.totalExpense + stats.totalBnplDebt).toLocaleString()}`, 75, 74);

  doc.setTextColor(stats.netBalance >= 0 ? 16 : 239, stats.netBalance >= 0 ? 185 : 68, stats.netBalance >= 0 ? 129 : 68);
  doc.text(`${currencySymbol} ${stats.netBalance.toLocaleString()}`, 130, 74);

  doc.setTextColor(79, 70, 229); // Indigo
  doc.text(`${stats.efficiencyScore.score}/100 (${stats.efficiencyScore.grade})`, 170, 74);

  // Efficiency Details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Savings Rate: ${stats.savingsRate.toFixed(1)}% | Fixed: ${stats.efficiencyScore.fixedCostPct.toFixed(0)}% | Variable: ${stats.efficiencyScore.variableCostPct.toFixed(0)}% | BNPL Burden: ${stats.efficiencyScore.bnplBurdenPct.toFixed(1)}%`, 20, 85);

  // Financial Auditor Key Recommendations
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('2. Financial Auditor Key Directives', 14, 102);

  let recY = 110;
  stats.efficiencyScore.keyRecommendations.forEach((rec, idx) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`• [Action ${idx + 1}] ${rec}`, 18, recY);
    recY += 7;
  });

  // Transaction Ledger Table
  recY += 6;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('3. Transaction Audit Ledger', 14, recY);

  recY += 6;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, recY, pageWidth - 28, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('DATE', 18, recY + 5);
  doc.text('TYPE', 45, recY + 5);
  doc.text('MERCHANT / DETAILS', 70, recY + 5);
  doc.text('CATEGORY', 125, recY + 5);
  doc.text('AMOUNT', pageWidth - 20, recY + 5, { align: 'right' });

  recY += 10;
  const sortedTx = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  sortedTx.slice(0, 30).forEach((tx) => {
    if (recY > 275) {
      doc.addPage();
      recY = 20;
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(tx.date, 18, recY);

    // Type badge
    if (tx.type === 'income') {
      doc.setTextColor(16, 185, 129);
      doc.text('INCOME', 45, recY);
    } else if (tx.type === 'bnpl') {
      doc.setTextColor(244, 63, 94);
      doc.text('BNPL', 45, recY);
    } else {
      doc.setTextColor(239, 68, 68);
      doc.text('EXPENSE', 45, recY);
    }

    doc.setTextColor(30, 41, 59);
    doc.text(tx.name.length > 28 ? tx.name.substring(0, 26) + '...' : tx.name, 70, recY);
    doc.setTextColor(100, 116, 139);
    doc.text(tx.category, 125, recY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(tx.type === 'income' ? 16 : 239, tx.type === 'income' ? 185 : 68, tx.type === 'income' ? 129 : 68);
    doc.text(`${tx.type === 'income' ? '+' : '-'}${currencySymbol} ${tx.amount.toLocaleString()}`, pageWidth - 20, recY, { align: 'right' });

    recY += 7;
  });

  // Footer Note
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('Report generated by FinTrack Pro • Stored locally in browser client IndexedDB', 14, 290);

  doc.save(`FinTrack_Pro_Audit_${profile.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export transactions to CSV format
 */
export function exportTransactionsCSV(transactions: Transaction[], profileName: string) {
  const headers = ['ID', 'Date', 'Type', 'Merchant/Name', 'Category', 'Amount', 'Payment Method', 'Fixed Cost', 'Notes'];
  const rows = transactions.map(t => [
    `"${t.id}"`,
    `"${t.date}"`,
    `"${t.type.toUpperCase()}"`,
    `"${t.name.replace(/"/g, '""')}"`,
    `"${t.category}"`,
    t.amount,
    `"${t.paymentMethod || 'Direct'}"`,
    t.isFixedCost ? 'YES' : 'NO',
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `FinTrack_${profileName.replace(/\s+/g, '_')}_Transactions.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

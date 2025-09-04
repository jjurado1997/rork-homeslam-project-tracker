import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Project, ProjectStats } from '@/types/project';

export const generateProjectPDF = async (project: Project, stats: ProjectStats) => {
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Group expenses by category
  const groupedExpenses = project.expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = [];
    }
    acc[expense.category].push(expense);
    return acc;
  }, {} as Record<string, typeof project.expenses>);

  // Calculate category totals
  const categoryTotals = Object.entries(groupedExpenses).map(([category, expenses]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    total: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    count: expenses.length
  }));

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Project Report - ${project.name}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f8f9fa;
          color: #333;
          line-height: 1.6;
        }
        .header {
          background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          margin-bottom: 30px;
          text-align: center;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #ffd700;
        }
        .project-title {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .project-address {
          font-size: 18px;
          opacity: 0.9;
          margin-bottom: 15px;
        }
        .project-dates {
          font-size: 14px;
          opacity: 0.8;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          margin-top: 15px;
          ${project.isCompleted 
            ? 'background-color: #10b981; color: white;' 
            : 'background-color: #f59e0b; color: white;'
          }
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          text-align: center;
          border-left: 4px solid #1a365d;
        }
        .stat-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #1a365d;
        }
        .stat-value.positive {
          color: #10b981;
        }
        .stat-value.negative {
          color: #ef4444;
        }
        .section {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 24px;
          font-weight: bold;
          color: #1a365d;
          margin-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        .category-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }
        .category-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #1a365d;
        }
        .category-name {
          font-size: 18px;
          font-weight: bold;
          color: #1a365d;
          margin-bottom: 8px;
        }
        .category-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .category-total {
          font-size: 20px;
          font-weight: bold;
          color: #ef4444;
        }
        .category-count {
          font-size: 14px;
          color: #666;
        }
        .expenses-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .expenses-table th {
          background: #1a365d;
          color: white;
          padding: 15px;
          text-align: left;
          font-weight: bold;
        }
        .expenses-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #e5e7eb;
        }
        .expenses-table tr:nth-child(even) {
          background: #f8f9fa;
        }
        .expense-amount {
          font-weight: bold;
          color: #ef4444;
          text-align: right;
        }
        .expense-date {
          color: #666;
          font-size: 14px;
        }
        .notes-section {
          background: #f0f9ff;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #0ea5e9;
        }
        .change-orders-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .change-orders-table th {
          background: #10b981;
          color: white;
          padding: 15px;
          text-align: left;
          font-weight: bold;
        }
        .change-orders-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #e5e7eb;
        }
        .change-orders-table tr:nth-child(even) {
          background: #f8f9fa;
        }
        .change-order-amount {
          font-weight: bold;
          color: #10b981;
          text-align: right;
        }
        .change-order-status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          text-align: center;
        }
        .status-approved {
          background-color: #10b981;
          color: white;
        }
        .status-pending {
          background-color: #f59e0b;
          color: white;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding: 20px;
          color: #666;
          font-size: 14px;
          border-top: 1px solid #e5e7eb;
        }
        @media print {
          body { background-color: white; }
          .header { background: #1a365d !important; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">Homeslam Inc.</div>
        <div class="project-title">${project.name}</div>
        ${project.address ? `<div class="project-address">${project.address}</div>` : ''}
        <div class="project-dates">
          Created: ${formatDate(project.projectStartDate)}
          ${project.completedAt ? ` • Completed: ${formatDate(project.completedAt)}` : ''}
        </div>
        <div class="status-badge">
          ${project.isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Revenue</div>
          <div class="stat-value">${formatCurrency(stats.totalRevenue)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Change Orders</div>
          <div class="stat-value positive">${formatCurrency(stats.totalChangeOrders)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Expenses</div>
          <div class="stat-value negative">${formatCurrency(stats.totalExpenses)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Net Profit</div>
          <div class="stat-value ${stats.profit >= 0 ? 'positive' : 'negative'}">
            ${formatCurrency(stats.profit)}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Profit Margin</div>
          <div class="stat-value ${stats.profitMargin >= 0 ? 'positive' : 'negative'}">
            ${stats.profitMargin.toFixed(1)}%
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Labor Percentage</div>
          <div class="stat-value">${stats.laborPercentage.toFixed(1)}%</div>
        </div>
      </div>

      ${categoryTotals.length > 0 ? `
        <div class="section">
          <div class="section-title">Expense Summary by Category</div>
          <div class="category-summary">
            ${categoryTotals.map(cat => `
              <div class="category-card">
                <div class="category-name">${cat.category}</div>
                <div class="category-stats">
                  <div class="category-total">${formatCurrency(cat.total)}</div>
                  <div class="category-count">${cat.count} item${cat.count !== 1 ? 's' : ''}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${(project.changeOrders && project.changeOrders.length > 0) ? `
        <div class="section">
          <div class="section-title">Change Orders</div>
          <table class="change-orders-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${project.changeOrders
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(changeOrder => `
                  <tr>
                    <td class="expense-date">${formatDate(changeOrder.date)}</td>
                    <td>${changeOrder.description}</td>
                    <td>
                      <span class="change-order-status ${changeOrder.approved ? 'status-approved' : 'status-pending'}">
                        ${changeOrder.approved ? 'APPROVED' : 'PENDING'}
                      </span>
                    </td>
                    <td class="change-order-amount">${formatCurrency(changeOrder.amount)}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${project.expenses.length > 0 ? `
        <div class="section">
          <div class="section-title">Detailed Expense Breakdown</div>
          <table class="expenses-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${project.expenses
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(expense => `
                  <tr>
                    <td class="expense-date">${formatDate(expense.date)}</td>
                    <td>${expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}</td>
                    <td>${expense.subcategory}</td>
                    <td>${expense.description || '-'}</td>
                    <td class="expense-amount">${formatCurrency(expense.amount)}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${project.notes ? `
        <div class="section">
          <div class="section-title">Project Notes</div>
          <div class="notes-section">
            ${project.notes.replace(/\n/g, '<br>')}
          </div>
        </div>
      ` : ''}

      <div class="footer">
        <p>Generated on ${formatDate(new Date())} • Homeslam Inc. Project Management System</p>
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    
    if (Platform.OS === 'web') {
      // For web, create a download link
      const link = document.createElement('a');
      link.href = uri;
      link.download = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For mobile, use sharing
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${project.name} - Project Report`,
          UTI: 'com.adobe.pdf'
        });
      }
    }
    
    return uri;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
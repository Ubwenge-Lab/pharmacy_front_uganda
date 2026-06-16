const fs = require('fs');
const files = [
  'src/app/branch/analytics/page.tsx',
  'src/app/pharmacy/analytics/page.tsx',
  'src/app/pharmacy/orders/page.tsx',
  'src/app/staff/orders/page.tsx',
  'src/app/super-admin/analytics/page.tsx',
  'src/app/super-admin/dashboard/page.tsx',
  'src/app/super-admin/pharmacies/[id]/page.tsx',
  'src/components/staff/CashierOrdersView.tsx',
  'src/components/staff/CashierPOSModal.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  if (!content.includes("import { formatCurrency }") && !content.includes("import {formatCurrency}")) {
      content = content.replace("import ", "import { formatCurrency } from '@/lib/currency';\nimport ");
  }

  const replacements = [
    ['`RWF ${Number(p.value).toLocaleString()}`', 'formatCurrency(p.value)'],
    ['`RWF ${fmt(totalRevenue)}`', 'formatCurrency(totalRevenue)'],
    ['`RWF ${fmt(avgOrderValue)}`', 'formatCurrency(avgOrderValue)'],
    ['`${fmt(a.totalRevenue)} RWF`', 'formatCurrency(a.totalRevenue)'],
    ['`${fmt(a.avgOrderValue)} RWF`', 'formatCurrency(a.avgOrderValue)'],
    ['`${Number(v).toLocaleString()} RWF`, \'\']', 'formatCurrency(v), \'\']'],
    ['`${fmt(a.totalRevenue)} RWF ${t(', '`${formatCurrency(a.totalRevenue)} ${t('],
    ['`${fmt(a.avgOrderValue)} RWF avg`', '`${formatCurrency(a.avgOrderValue)} avg`'],
    ['{fmt(a.targetRevenue)} RWF', '{formatCurrency(a.targetRevenue)}'],
    ['{order.total?.toLocaleString()} RWF', '{formatCurrency(order.total)}'],
    ['{fmt(order.total)}', '{formatCurrency(order.total)}'],
    ['{fmt(item.price * item.quantity)}', '{formatCurrency(item.price * item.quantity)}'],
    ['{fmt(receipt.amount)}', '{formatCurrency(receipt.amount)}'],
    ['{fmt(totalDue)}', '{formatCurrency(totalDue)}'],
    ['{fmt(change)}', '{formatCurrency(change)}'],
    ['{Number(order.total ?? 0).toLocaleString()} RWF', '{formatCurrency(order.total)}'],
    ['{Number(o.total ?? 0).toLocaleString()}', '{formatCurrency(o.total)}'],
    ['`RWF ${analytics?.totalRevenue?.toLocaleString() || 0}`', 'formatCurrency(analytics?.totalRevenue)'],
    ['`$${analytics?.platformRevenue?.toLocaleString() || 0}`', 'formatCurrency(analytics?.platformRevenue as number)'],
    ['`$${analytics?.platformFeePerPharmacy || 0}/pharmacy/month`', '`${formatCurrency(analytics?.platformFeePerPharmacy)}/pharmacy/month`'],
    ['$${analytics?.platformRevenue?.toLocaleString() || 0}', '{formatCurrency(analytics?.platformRevenue)}'],
    ['$${analytics?.totalRevenue?.toLocaleString() || 0}', '{formatCurrency(analytics?.totalRevenue)}'],
    ['RWF {analytics?.totalRevenue?.toLocaleString() || 0}', '{formatCurrency(analytics?.totalRevenue)}'],
    ['${revenue?.transactionCount ? ((revenue.totalRevenue ?? 0) / revenue.transactionCount).toFixed(2) : 0}', '{formatCurrency(revenue?.transactionCount ? ((revenue.totalRevenue ?? 0) / revenue.transactionCount) : 0)}'],
    ['{analytics?.platformFeePerPharmacy || 0}', '{formatCurrency(analytics?.platformFeePerPharmacy)}'],
    ['RWF {Number(p.value).toLocaleString()}', '{formatCurrency(p.value)}']
  ];

  for (const [from, to] of replacements) {
    while(content.includes(from)) {
      content = content.replace(from, to);
    }
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
}

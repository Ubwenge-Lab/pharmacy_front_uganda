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

  // Add import if missing
  if (!content.includes("import { formatCurrency }") && !content.includes("import {formatCurrency}")) {
      content = content.replace("import ", "import { formatCurrency } from '@/lib/currency';\nimport ");
  }

  // Common replacements
  content = content.replace(/{Number\(([^)]+)\)\.toLocaleString\(\)\} RWF/g, "{formatCurrency()}");
  content = content.replace(/{Number\(([^)]+)\)\.toLocaleString\(\)}/g, "{formatCurrency()}");
  content = content.replace(/\RWF \$\{Number\(([^)]+)\)\.toLocaleString\(\)\}\/g, "formatCurrency()");
  content = content.replace(/\\$\{Number\(([^)]+)\)\.toLocaleString\(\)\} RWF\/g, "formatCurrency()");
  content = content.replace(/\RWF \$\{fmt\(([^)]+)\)\}\/g, "formatCurrency()");
  content = content.replace(/\\$\{fmt\(([^)]+)\)\} RWF\/g, "formatCurrency()");
  content = content.replace(/\{order\.total\?\.toLocaleString\(\)\} RWF/g, "{formatCurrency(order.total)}");
  content = content.replace(/\{fmt\(([^)]+)\)\}/g, "{formatCurrency()}");

  // Super-admin Analytics string fixes
  content = content.replace(/'Total Revenue \\(RWF\\)'/g, "'Total Revenue'");
  content = content.replace(/\RWF \$\{analytics\?\.totalRevenue\?\.toLocaleString\(\) \|\| 0\}\/g, "formatCurrency(analytics?.totalRevenue)");
  content = content.replace(/\\\\$\$\{analytics\?\.platformRevenue\?\.toLocaleString\(\) \|\| 0\}\/g, "formatCurrency(analytics?.platformRevenue as number)");
  content = content.replace(/\\\\$\$\{analytics\?\.platformFeePerPharmacy \|\| 0\}\/pharmacy\/month\/g, "\\/pharmacy/month\");
  
  // Super-admin Dashboard specific
  content = content.replace(/\\\$\$\{analytics\?\.platformRevenue\?\.toLocaleString\(\) \|\| 0\}/g, "{formatCurrency(analytics?.platformRevenue)}");
  content = content.replace(/\\\$\$\{analytics\?\.totalRevenue\?\.toLocaleString\(\) \|\| 0\}/g, "{formatCurrency(analytics?.totalRevenue)}");

  // Pharmacy Analytics specifics
  content = content.replace(/<Tooltip formatter=\{\(v: any\) => \[\\$\{Number\(v\)\.toLocaleString\(\)\} RWF\, ''\]\}/g, "<Tooltip formatter={(v: any) => [formatCurrency(v), '']}");
  content = content.replace(/sub=\\$\{fmt\(a\.totalRevenue\)\} RWF/g, "sub={\");
  content = content.replace(/sub=\\$\{fmt\(a\.avgOrderValue\)\} RWF avg\/g, "sub={\ avg");
  content = content.replace(/\{fmt\(a\.targetRevenue\)\} RWF/g, "{formatCurrency(a.targetRevenue)}");

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
}

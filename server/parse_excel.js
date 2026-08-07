const XLSX = require('xlsx');
const fs = require('fs');

// Parse 顺序版
const workbook1 = XLSX.readFile('../assets/雅思常用8000词EXCEL版-顺序版-无水印.xls');
const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
const data1 = XLSX.utils.sheet_to_json(sheet1, { header: 1 });

console.log('=== 顺序版 ===');
console.log('Sheet names:', workbook1.SheetNames);
console.log('Total rows:', data1.length);
console.log('First 5 rows:');
for (let i = 0; i < Math.min(5, data1.length); i++) {
  console.log(JSON.stringify(data1[i]));
}

// Parse 乱序版
const workbook2 = XLSX.readFile('../assets/雅思常用8000词EXCEL词-乱序版-无水印.xls');
const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
const data2 = XLSX.utils.sheet_to_json(sheet2, { header: 1 });

console.log('\n=== 乱序版 ===');
console.log('Sheet names:', workbook2.SheetNames);
console.log('Total rows:', data2.length);
console.log('First 5 rows:');
for (let i = 0; i < Math.min(5, data2.length); i++) {
  console.log(JSON.stringify(data2[i]));
}

const XLSX = require('xlsx');

function readExcelFile(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Get name of first sheet
    const worksheet = workbook.Sheets[sheetName]; // Get worksheet
    const jsonData = XLSX.utils.sheet_to_json(worksheet); // Convert worksheet to JSON

    // Map JSON data to desired format
    const result = jsonData.map(row => ({
        name: row['Name'].toString(),
        referal_code: row['Referral Code'].toString(),
        college: row['College Name'].toString(),
        count: 0,
    }));

    return result;
}

module.exports = readExcelFile;
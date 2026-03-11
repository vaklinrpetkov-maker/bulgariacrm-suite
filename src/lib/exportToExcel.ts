import ExcelJS from "exceljs";

export async function exportToExcel(
  data: Record<string, unknown>[],
  columns: { key: string; label: string }[],
  fileName: string
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Data");

  worksheet.columns = columns.map((col) => ({
    header: col.label,
    key: col.key,
    width: 20,
  }));

  data.forEach((row) => {
    const rowData: Record<string, unknown> = {};
    columns.forEach((col) => {
      rowData[col.key] = row[col.key] ?? "";
    });
    worksheet.addRow(rowData);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

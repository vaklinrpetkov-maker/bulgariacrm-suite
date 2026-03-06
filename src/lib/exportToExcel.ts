import * as XLSX from "xlsx";

export function exportToExcel(
  data: Record<string, unknown>[],
  columns: { key: string; label: string }[],
  fileName: string
) {
  const rows = data.map((row) =>
    columns.reduce((acc, col) => {
      acc[col.label] = row[col.key] ?? "";
      return acc;
    }, {} as Record<string, unknown>)
  );

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

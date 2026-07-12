import { Transaction } from "../types";

/**
 * Escapes a CSV field if it contains commas, double quotes, or newlines.
 */
function escapeCsvField(field: string | number | undefined): string {
  if (field === undefined || field === null) {
    return "";
  }
  const str = String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts transactions into a CSV format string with exact columns:
 * Date,Description,Amount,Category,Notes
 */
export function convertToCSV(transactions: Transaction[]): string {
  const headers = ["Date", "Description", "Amount", "Category", "Notes"];
  
  const rows = transactions.map((t) => [
    t.date,
    t.description,
    t.amount.toFixed(2),
    t.category,
    t.notes,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map(escapeCsvField).join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Triggers a client-side download of the CSV data.
 */
export function downloadCSV(transactions: Transaction[], filename: string = "transactions.csv") {
  const csvContent = convertToCSV(transactions);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

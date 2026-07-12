export interface Transaction {
  id?: string; // Client-side unique identifier for key rendering and modifications
  date: string;
  description: string;
  amount: number;
  category: string;
  notes: string;
}

export interface ExtractionResult {
  bankName: string;
  statementPeriod: string;
  currency: string;
  totalDeposits: number;
  totalWithdrawals: number;
  transactions: Transaction[];
}

export type SortField = "date" | "amount" | "description" | "category";
export type SortOrder = "asc" | "desc";

export const ALLOWED_CATEGORIES = [
  "Income",
  "Shopping",
  "Food",
  "Travel",
  "Fuel",
  "Bills",
  "Entertainment",
  "Healthcare",
  "Education",
  "ATM Withdrawal",
  "Transfer",
  "UPI",
  "NEFT",
  "IMPS",
  "Cash Deposit",
  "Cash Withdrawal",
  "EMI",
  "Investment",
  "Insurance",
  "Rent",
  "Salary",
  "Tax",
  "Fees",
  "Others",
] as const;

export type CategoryType = typeof ALLOWED_CATEGORIES[number];

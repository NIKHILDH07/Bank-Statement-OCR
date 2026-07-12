import React, { useState, useMemo } from "react";
import {
  Transaction,
  SortField,
  SortOrder,
  ALLOWED_CATEGORIES,
  CategoryType,
} from "../types";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Check,
  X,
  Plus,
  Filter,
  DollarSign,
  Undo2,
  Download,
} from "lucide-react";
import { downloadCSV } from "../utils/csv";

interface EditableTableProps {
  transactions: Transaction[];
  onTransactionsUpdate: (updated: Transaction[]) => void;
  currency: string;
}

export function EditableTable({
  transactions,
  onTransactionsUpdate,
  currency,
}: EditableTableProps) {
  // Search state
  const [searchTerm, setSearchTerm] = useState<string>("");
  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  // Debit/Credit filter state
  const [selectedType, setSelectedType] = useState<"All" | "Debit" | "Credit">("All");

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Row edit state
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Transaction>>({});

  // Currency utility
  const getCurrencySymbol = (code: string) => {
    const symbolMap: { [key: string]: string } = {
      USD: "$",
      INR: "₹",
      EUR: "€",
      GBP: "£",
      AUD: "A$",
      CAD: "C$",
      JPY: "¥",
    };
    return symbolMap[code.toUpperCase()] || code || "$";
  };
  const symbol = getCurrencySymbol(currency);

  // Helper to parse DD/MM/YYYY dates for chronological sorting
  const parseDateForSorting = (dateStr: string): number => {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    }
    return 0;
  };

  // Sort and Filter Logic
  const processedTransactions = useMemo(() => {
    let result = [...transactions];

    // 1. Apply Search Filter (on Description, Notes, Category, Date)
    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(lowerSearch) ||
          t.notes.toLowerCase().includes(lowerSearch) ||
          t.category.toLowerCase().includes(lowerSearch) ||
          t.date.includes(lowerSearch)
      );
    }

    // 2. Apply Category Filter
    if (selectedCategory !== "All") {
      result = result.filter((t) => t.category === selectedCategory);
    }

    // 3. Apply Type Filter (Debit vs Credit)
    if (selectedType !== "All") {
      if (selectedType === "Debit") {
        result = result.filter((t) => t.amount < 0);
      } else {
        result = result.filter((t) => t.amount >= 0);
      }
    }

    // 4. Apply Sorting
    result.sort((a, b) => {
      let comparison = 0;

      if (sortField === "date") {
        const dateA = parseDateForSorting(a.date);
        const dateB = parseDateForSorting(b.date);
        comparison = dateA - dateB;
      } else if (sortField === "amount") {
        comparison = a.amount - b.amount;
      } else {
        const fieldA = String(a[sortField]).toLowerCase();
        const fieldB = String(b[sortField]).toLowerCase();
        comparison = fieldA.localeCompare(fieldB);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [transactions, searchTerm, selectedCategory, selectedType, sortField, sortOrder]);

  // Pagination Logic
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [processedTransactions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedTransactions.length / itemsPerPage) || 1;

  // Change sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc"); // Default to descending
    }
    setCurrentPage(1);
  };

  // Editing handlers
  const startEditing = (transaction: Transaction) => {
    if (!transaction.id) return;
    setEditingRowId(transaction.id);
    setEditFormData({ ...transaction });
  };

  const cancelEditing = () => {
    setEditingRowId(null);
    setEditFormData({});
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "amount") {
      setEditFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const saveEdit = (id: string) => {
    const updated = transactions.map((t) => {
      if (t.id === id) {
        // Validation check
        const finalDate = editFormData.date || t.date;
        const finalDesc = editFormData.description || t.description;
        const finalAmt = editFormData.amount !== undefined ? editFormData.amount : t.amount;
        const finalCat = editFormData.category || t.category;
        const finalNotes = editFormData.notes || t.notes;

        return {
          ...t,
          date: finalDate,
          description: finalDesc,
          amount: finalAmt,
          category: finalCat,
          notes: finalNotes,
        };
      }
      return t;
    });
    onTransactionsUpdate(updated);
    setEditingRowId(null);
    setEditFormData({});
  };

  const deleteTransaction = (id: string) => {
    if (confirm("Are you sure you want to delete this transaction row?")) {
      const updated = transactions.filter((t) => t.id !== id);
      onTransactionsUpdate(updated);
      // Reset page if needed
      if (currentPage > Math.ceil(updated.length / itemsPerPage) && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    }
  };

  // Add Manual Row
  const addNewRow = () => {
    const newTx: Transaction = {
      id: "manual-" + Date.now(),
      date: new Date().toLocaleDateString("en-GB"), // DD/MM/YYYY
      description: "Manual Transaction Entry",
      amount: -100.0,
      category: "Others",
      notes: "Debit",
    };
    const updated = [newTx, ...transactions];
    onTransactionsUpdate(updated);
    setEditingRowId(newTx.id!);
    setEditFormData(newTx);
    setCurrentPage(1);
  };

  // Download filtered CSV
  const handleDownloadCSV = () => {
    downloadCSV(processedTransactions, "bank_statement_transactions.csv");
  };

  return (
    <div id="editable-table-root" className="space-y-4">
      {/* Search, Filters, and Export Options */}
      <div
        id="table-controls-container"
        className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 xl:flex xl:items-center gap-3 flex-1">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            <input
              id="transaction-search"
              type="text"
              placeholder="Search date, desc..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 shrink-0">
              Category:
            </span>
            <select
              id="category-filter-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-auto px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Categories</option>
              {ALLOWED_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Debit/Credit Toggle dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 shrink-0">
              Type:
            </span>
            <select
              id="type-filter-select"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full md:w-auto px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Types</option>
              <option value="Debit">Debits / Outgoing</option>
              <option value="Credit">Credits / Incoming</option>
            </select>
          </div>
        </div>

        {/* Action Button Suite */}
        <div className="flex items-center gap-2.5 shrink-0 self-end xl:self-auto">
          <button
            id="add-custom-row-btn"
            onClick={addNewRow}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add Row</span>
          </button>

          <button
            id="download-csv-btn"
            onClick={handleDownloadCSV}
            disabled={processedTransactions.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-black rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table View */}
      <div
        id="transactions-table-card"
        className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden"
      >
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                <th
                  onClick={() => handleSort("date")}
                  className="px-5 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/40 select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Date</span>
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("description")}
                  className="px-5 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/40 select-none min-w-[200px]"
                >
                  <div className="flex items-center space-x-1">
                    <span>Description</span>
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("amount")}
                  className="px-5 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/40 select-none text-right"
                >
                  <div className="flex items-center space-x-1 justify-end">
                    <span>Amount</span>
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("category")}
                  className="px-5 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/40 select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Category</span>
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="px-5 py-3 select-none">Notes</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm text-zinc-700 dark:text-zinc-300">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                        No transactions found matching your criteria.
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedCategory("All");
                          setSelectedType("All");
                        }}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                      >
                        <Undo2 className="h-3 w-3" />
                        <span>Reset Filters</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((t) => {
                  const isEditing = editingRowId === t.id;
                  const isExpense = t.amount < 0;

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors align-middle"
                    >
                      {/* DATE */}
                      <td className="px-5 py-3.5 font-mono text-xs whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            name="date"
                            value={editFormData.date || ""}
                            onChange={handleEditChange}
                            placeholder="DD/MM/YYYY"
                            className="px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs w-28 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          t.date
                        )}
                      </td>

                      {/* DESCRIPTION */}
                      <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-100 max-w-xs truncate sm:max-w-md">
                        {isEditing ? (
                          <input
                            type="text"
                            name="description"
                            value={editFormData.description || ""}
                            onChange={handleEditChange}
                            className="px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs w-full focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          t.description
                        )}
                      </td>

                      {/* AMOUNT */}
                      <td className={`px-5 py-3.5 text-right font-mono font-bold whitespace-nowrap ${
                        isExpense ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            name="amount"
                            value={editFormData.amount !== undefined ? editFormData.amount : ""}
                            onChange={handleEditChange}
                            className="px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs w-24 text-right focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          <>
                            {isExpense ? "-" : "+"}
                            {symbol}
                            {Math.abs(t.amount).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </>
                        )}
                      </td>

                      {/* CATEGORY */}
                      <td className="px-5 py-3.5">
                        {isEditing ? (
                          <select
                            name="category"
                            value={editFormData.category || ""}
                            onChange={handleEditChange}
                            className="px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          >
                            {ALLOWED_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            {t.category}
                          </span>
                        )}
                      </td>

                      {/* NOTES */}
                      <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400 text-xs italic">
                        {isEditing ? (
                          <input
                            type="text"
                            name="notes"
                            value={editFormData.notes || ""}
                            onChange={handleEditChange}
                            className="px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs w-full focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          t.notes
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-3.5 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              id={`save-tx-btn-${t.id}`}
                              onClick={() => saveEdit(t.id!)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg cursor-pointer"
                              title="Save changes"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              id={`cancel-tx-btn-${t.id}`}
                              onClick={cancelEditing}
                              className="p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 rounded-lg cursor-pointer"
                              title="Cancel changes"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              id={`edit-tx-btn-${t.id}`}
                              onClick={() => startEditing(t)}
                              className="p-1 text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 rounded-lg cursor-pointer"
                              title="Edit transaction"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              id={`delete-tx-btn-${t.id}`}
                              onClick={() => deleteTransaction(t.id!)}
                              className="p-1 text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 rounded-lg cursor-pointer"
                              title="Delete transaction"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footers */}
        {processedTransactions.length > 0 && (
          <div
            id="table-pagination-container"
            className="px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400"
          >
            <div className="flex items-center space-x-2">
              <span>Show</span>
              <select
                id="items-per-page-select"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold focus:outline-hidden text-zinc-700 dark:text-zinc-300"
              >
                <option value={10}>10 items</option>
                <option value={25}>25 items</option>
                <option value={50}>50 items</option>
              </select>
              <span>
                of <strong>{processedTransactions.length}</strong> items
              </span>
            </div>

            <div className="flex items-center space-x-1.5 font-medium">
              <button
                id="prev-page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-3">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>

              <button
                id="next-page-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

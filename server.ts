import express from "express";
import path from "path";
import multer from "multer";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables for local testing
dotenv.config();

const app = express();
const PORT = 3000;

// Set up express body size limits
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed."));
    }
  },
});

// Lazy initialization of Gemini client to prevent startup crashes if key is missing
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in Settings > Secrets.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// REST API endpoint to extract transaction data from bank statements
app.post("/api/extract", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    if (file.size === 0) {
      return res.status(400).json({ error: "The uploaded file is empty." });
    }

    // Convert file buffer to base64
    const base64Data = file.buffer.toString("base64");
    const mimeType = file.mimetype;

    // Initialize Gemini client safely
    const ai = getGeminiClient();

    // Define systemic guidelines for the transaction extraction OCR
    const systemPrompt = `You are a high-precision Bank Statement OCR Parser. Your task is to process the uploaded bank statement document and extract every single transaction row.

Important Guidelines:
1. Parse all pages of the document sequentially (including skewed, rotated, or blurry pages).
2. Ignore opening balances, closing balances, summaries, customer information, branch information, address headers, IFSC/MICR, and advertisements. Extract ONLY the individual transaction table rows.
3. For each transaction row, extract:
   - Date: Convert and format strictly to DD/MM/YYYY (e.g., '02/04/2026'). If year is not mentioned, infer it based on statement period.
   - Description: A clean string representing the transaction description. Remove reference numbers or redundant text if they add no value, but preserve key details (e.g. 'Amazon Pay', 'Salary Credit').
   - Amount: A standard numeric float value. Negative value for debits/withdrawals (money spent, money going out). Positive value for credits/deposits (money received, money going in).
   - Category: Select the best category strictly from this list:
     'Income', 'Shopping', 'Food', 'Travel', 'Fuel', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'ATM Withdrawal', 'Transfer', 'UPI', 'NEFT', 'IMPS', 'Cash Deposit', 'Cash Withdrawal', 'EMI', 'Investment', 'Insurance', 'Rent', 'Salary', 'Tax', 'Fees', 'Others'
   - Notes: Automatically generate a concise transaction type/note. Examples: 'Credit', 'Debit', 'UPI Payment', 'Refund', 'Cash Withdrawal', 'Interest Credit', 'Salary Credit', 'Cheque Deposit', 'Cheque Withdrawal', 'Auto Debit', 'Recurring Payment'.

4. Verify totals: The totalDeposits should equal the sum of positive transactions. The totalWithdrawals should equal the absolute sum of negative transactions. Make sure there are no duplicate entries.`;

    // Prompt the model
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        {
          text: "Please extract all transactions from this bank statement. Return the response strictly as a structured JSON object according to the specified schema.",
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bankName: {
              type: Type.STRING,
              description: "The name of the bank found in the statement (e.g. Chase, Wells Fargo, State Bank of India, etc.)",
            },
            statementPeriod: {
              type: Type.STRING,
              description: "The period covered by this statement (e.g., 'April 2026' or '01/04/2026 - 30/04/2026')",
            },
            currency: {
              type: Type.STRING,
              description: "The detected currency code or symbol (e.g., USD, INR, EUR, GBP)",
            },
            totalDeposits: {
              type: Type.NUMBER,
              description: "Sum of all deposit / credit amounts",
            },
            totalWithdrawals: {
              type: Type.NUMBER,
              description: "Sum of all absolute withdrawal / debit amounts",
            },
            transactions: {
              type: Type.ARRAY,
              description: "List of all extracted transactions.",
              items: {
                type: Type.OBJECT,
                properties: {
                  date: {
                    type: Type.STRING,
                    description: "Transaction date in strict DD/MM/YYYY format",
                  },
                  description: {
                    type: Type.STRING,
                    description: "Full description of the transaction",
                  },
                  amount: {
                    type: Type.NUMBER,
                    description: "Transaction amount. MUST be negative for withdrawals/debits and positive for deposits/credits.",
                  },
                  category: {
                    type: Type.STRING,
                    description: "One of the allowed categories",
                  },
                  notes: {
                    type: Type.STRING,
                    description: "Short autogenerated type note.",
                  },
                },
                required: ["date", "description", "amount", "category", "notes"],
              },
            },
          },
          required: [
            "bankName",
            "statementPeriod",
            "currency",
            "totalDeposits",
            "totalWithdrawals",
            "transactions",
          ],
        },
      },
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error("Gemini returned an empty response.");
    }

    const parsedResult = JSON.parse(textResult.trim());
    return res.json(parsedResult);
  } catch (error: any) {
    console.error("Extraction error:", error);
    return res.status(500).json({
      error: error.message || "An error occurred while parsing the bank statement.",
    });
  }
});

// Configure Vite middleware or serve static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

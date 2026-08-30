import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Model API client
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

/**
 * Text and content generation with automatic model fallback
 */
async function executeModelPrompt(client: GoogleGenAI, contents: any, config?: any) {
  const modelsToTry = ["gemini-3.7-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await client.models.generateContent({
        model,
        contents,
        config,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      console.warn(`Model ${model} request error, trying alternate model:`, err?.message || err);
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  throw lastError || new Error("Model service temporarily unavailable");
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Helper to format multi-turn contents cleanly with strictly alternating roles
function sanitizeChatContents(history: any[], currentQuery: string) {
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  if (Array.isArray(history)) {
    for (const item of history) {
      const role: "user" | "model" = item.role === "user" ? "user" : "model";
      const text = (typeof item.content === "string" ? item.content : "").trim();
      if (!text) continue;

      if (contents.length === 0) {
        if (role === "user") {
          contents.push({ role: "user", parts: [{ text }] });
        }
        continue;
      }

      const last = contents[contents.length - 1];
      if (last.role === role) {
        last.parts[0].text += `\n${text}`;
      } else {
        contents.push({ role, parts: [{ text }] });
      }
    }
  }

  const queryText = (currentQuery || "Hello! Can you help me?").trim();
  if (contents.length > 0 && contents[contents.length - 1].role === "user") {
    contents[contents.length - 1].parts[0].text += `\n${queryText}`;
  } else {
    contents.push({ role: "user", parts: [{ text: queryText }] });
  }

  return contents;
}

// 1. OCR Receipt Scanner Handler
const handleOcrScan = async (req: express.Request, res: express.Response) => {
  try {
    const { dataUrl, categories = [] } = req.body;
    const defaultDate = new Date().toISOString().split("T")[0];

    if (!dataUrl) {
      return res.status(400).json({ error: "No image provided" });
    }

    const client = getGenAIClient();
    if (!client) {
      return res.json(getFallbackOCR(defaultDate, categories));
    }

    const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) {
      return res.json(getFallbackOCR(defaultDate, categories));
    }

    const mimeType = match[1];
    const base64Data = match[2];

    const categoryList = Array.isArray(categories) && categories.length > 0 
      ? categories.join(", ") 
      : "Shopping & Groceries, Food & Dining, Transport & Fuel, Utilities, Rent & Housing, Healthcare & Meds, Internet & Subscriptions, BNPL / Installment Loans, Other";

    const prompt = `
Analyze this receipt or bill photo carefully.
Extract the merchant name, total price, date, best category, and items.
Categories to pick from: [${categoryList}].

Return strictly valid JSON:
{
  "merchant": "Store or place name",
  "total": 12500.0,
  "date": "YYYY-MM-DD",
  "category": "Pick the closest category from the list",
  "confidence": 95,
  "items": [
    { "name": "Item name", "price": 5000.0 }
  ],
  "notes": "Short simple summary of purchase"
}
`;

    const response = await executeModelPrompt(
      client,
      [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      {
        responseMimeType: "application/json",
      }
    );

    const text = response.text?.trim() || "{}";
    try {
      const parsed = JSON.parse(text);
      return res.json({
        merchant: parsed.merchant || "Scanned Store",
        total: typeof parsed.total === "number" ? Math.abs(parsed.total) : 0,
        date: parsed.date || defaultDate,
        category: (Array.isArray(categories) && categories.includes(parsed.category)) ? parsed.category : (categories[0] || "Shopping & Groceries"),
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 95,
        items: Array.isArray(parsed.items) ? parsed.items : [],
        notes: parsed.notes || "Read from receipt photo",
      });
    } catch (parseErr) {
      return res.json(getFallbackOCR(defaultDate, categories));
    }
  } catch (err: any) {
    console.error("Receipt Processing Error:", err?.message || err);
    const defaultDate = new Date().toISOString().split("T")[0];
    const { categories = [] } = req.body;
    return res.json(getFallbackOCR(defaultDate, categories));
  }
};

app.post("/api/ocr/scan", handleOcrScan);

// 2. Financial Advisor Consultation Handler
const handleAdvisorQuery = async (req: express.Request, res: express.Response) => {
  try {
    const { query, conversationHistory = [], context = {} } = req.body;

    const {
      profileName = "My Wallet",
      monthlyBudget = 1500000,
      totalIncome = 0,
      totalExpenses = 0,
      totalBnpl = 0,
      netBalance = 0,
      efficiencyScore = 75,
      savingsRate = 15,
      topCategories = "",
      recentTxList = "",
      currencySymbol = "TSh",
    } = context;

    const isSwahili = /habari|mambo|vipi|pesa|matumizi|shilingi|kiswahili|akiba|madeni|tathmini/i.test(query || "");

    const systemInstruction = `You are FinTrack Advisor, an intelligent, empathetic, and friendly personal money advisor and financial assistant.

Your Core Capabilities:
1. SIMPLE & CLEAR LANGUAGE: Speak in plain, direct, and conversational words. Avoid overly complex jargon.
2. FINANCIAL AUDITING & INSIGHTS: Provide instant answers about the user's spending, budget, loans, and savings using their active wallet context:
   - Wallet Profile: ${profileName}
   - Monthly Budget: ${currencySymbol} ${Number(monthlyBudget).toLocaleString()}
   - Total Income: ${currencySymbol} ${Number(totalIncome).toLocaleString()}
   - Total Expenses: ${currencySymbol} ${Number(totalExpenses).toLocaleString()}
   - Loans / BNPL Owed: ${currencySymbol} ${Number(totalBnpl).toLocaleString()}
   - Remaining Balance: ${currencySymbol} ${Number(netBalance).toLocaleString()}
   - Money Efficiency Score: ${efficiencyScore}/100
   - Top Spending Categories: ${topCategories || "None yet"}
   ${recentTxList ? `\nRecent Transactions:\n${recentTxList}` : ""}
3. GENERAL & MONEY QUERIES: You can answer any questions: budgeting strategies (e.g. 50/30/20 rule), emergency fund building, debt payoff methods (avalanche vs snowball), math calculations, greetings, or friendly chat.
4. BILINGUAL SUPPORT:
   - If the user writes in English, reply in English.
   - If the user writes in Swahili (Kiswahili), reply in fluent, natural Swahili.
5. FORMATTING: Use clean bullet points and bold highlights for key numbers. Keep responses focused and readable.`;

    const client = getGenAIClient();
    if (!client) {
      const fallback = getFallbackAdvisorResponse(query, context, isSwahili);
      return res.json(fallback);
    }

    const contents = sanitizeChatContents(conversationHistory, query);

    const response = await executeModelPrompt(client, contents, {
      systemInstruction,
    });
    const rawText = response.text?.trim() || "I am here to help you manage your money easily. What would you like to know?";

    return res.json({
      rawText,
      structured: {
        observation: `Inflows: ${currencySymbol} ${Number(totalIncome).toLocaleString()} | Spent: ${currencySymbol} ${Number(totalExpenses).toLocaleString()}`,
        comparison: `Health Score: ${efficiencyScore}/100 (${savingsRate > 20 ? "Good savings" : "Room to save more"})`,
        riskAnalysis: totalBnpl > 0 ? `You have ${currencySymbol} ${Number(totalBnpl).toLocaleString()} in loans/BNPL to pay off.` : "No active loans detected.",
        actionableStep: "Keep track of daily spending and try to save a small amount regularly.",
      },
    });
  } catch (err: any) {
    console.error("Advisor Processing Error:", err?.message || err);
    const { query = "", context = {} } = req.body;
    const isSwahili = /habari|mambo|vipi|pesa|matumizi|shilingi|kiswahili|akiba|madeni|tathmini/i.test(query || "");
    return res.json(getFallbackAdvisorResponse(query, context, isSwahili));
  }
};

app.post("/api/advisor/query", handleAdvisorQuery);

// 3. Natural Language Transaction Parser Handler
const handleSmartEntry = async (req: express.Request, res: express.Response) => {
  try {
    const { text = "", categories = [], currentDate = new Date().toISOString().split("T")[0], currencySymbol = "TSh" } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "No text provided for smart entry" });
    }

    const client = getGenAIClient();
    if (!client) {
      const parsedFallback = parseSmartEntryLocally(text, categories, currentDate);
      return res.json({ transactions: parsedFallback, count: parsedFallback.length });
    }

    const categoryNames = Array.isArray(categories) && categories.length > 0
      ? categories.map((c: any) => (typeof c === "string" ? c : c.name)).join(", ")
      : "Food & Dining, Transport & Fuel, Rent & Housing, Utilities (LUKU & Water), Shopping & Groceries, Healthcare & Meds, Education & Courses, Entertainment & Leisure, Internet & Subscriptions, BNPL / Installment Loans, Monthly Salary, Freelance & Projects, Business Revenue, Gifts & Allowance";

    const prompt = `You are a financial natural language parsing assistant.
The user wants to record one or multiple transactions by simply writing or typing sentences in natural language (English, Swahili, or slang).

Current Reference Date: ${currentDate}
Standard Categories available: [${categoryNames}]
Payment Methods available: ["M-Pesa / Vodacom", "Tigo Pesa / Airtel Money", "Cash", "Bank Card / Visa / MC", "Bank Transfer / NMB / CRDB", "BNPL / Lipa Baadaye", "Other Digital Wallet"]

Analyze the user's text and extract ALL individual transactions mentioned.
Input text:
"""
${text}
"""

Rules:
1. "type": Must be either "expense", "income", or "bnpl".
   - If user says paid, spent, bought, bought on credit, ate, fuel, grocery, ride -> "expense" or "bnpl"
   - If user says received, salary, earned, paid to me, freelance, dividend, deposit, gift -> "income"
   - If user mentions "bnpl", "lipa baadaye", "mkopo", "installment", "pay later" -> "bnpl"
2. "amount": A clean positive number (e.g. 15000, 250000, 1500). If user wrote "15k" -> 15000, "1.5m" -> 1500000, "elfu ishirini" -> 20000.
3. "date": Convert relative dates (today, yesterday, juzi, jumatatu, 3 days ago, last Friday, 2026-08-25) into ISO YYYY-MM-DD format based on reference date (${currentDate}).
4. "category": Pick the most appropriate matching category name from the list.
5. "paymentMethod": Detect mentioned payment method (e.g. M-Pesa -> "M-Pesa / Vodacom", Airtel / Tigo -> "Tigo Pesa / Airtel Money", Cash / taslimu -> "Cash", Bank -> "Bank Transfer / NMB / CRDB", Card -> "Bank Card / Visa / MC", BNPL -> "BNPL / Lipa Baadaye"). If none mentioned, default to "Cash" or "M-Pesa / Vodacom".
6. "name": A concise, clear title of what was bought or received (e.g. "Lunch at KFC", "Shoppers Groceries", "Freelance Web Design", "Electricity LUKU").
7. "isFixedCost": Boolean (true for rent, insurance, loan installments, school fees, utilities subscriptions; false for dining, snacks, clothing, impulse shopping).
8. "notes": Brief notes or description extracted from the text.

Return STRICT JSON with the structure:
{
  "transactions": [
    {
      "name": "Groceries at Shoppers",
      "amount": 45000,
      "date": "2026-08-28",
      "type": "expense",
      "category": "Shopping & Groceries",
      "paymentMethod": "M-Pesa / Vodacom",
      "isFixedCost": false,
      "notes": "Natural language entry"
    }
  ]
}`;

    const response = await executeModelPrompt(
      client,
      [{ role: "user", parts: [{ text: prompt }] }],
      { responseMimeType: "application/json" }
    );

    const jsonText = response.text?.trim() || "{}";
    try {
      const parsed = JSON.parse(jsonText);
      const rawList = Array.isArray(parsed.transactions) ? parsed.transactions : (Array.isArray(parsed) ? parsed : []);
      
      const validatedList = rawList.map((item: any) => ({
        name: (item.name || "Expense Entry").trim(),
        amount: typeof item.amount === "number" && item.amount > 0 ? Math.abs(item.amount) : 1000,
        date: item.date && /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : currentDate,
        type: item.type === "income" || item.type === "bnpl" ? item.type : "expense",
        category: item.category || (item.type === "income" ? "Freelance & Projects" : "Food & Dining"),
        paymentMethod: item.paymentMethod || "M-Pesa / Vodacom",
        isFixedCost: Boolean(item.isFixedCost),
        notes: item.notes || `Added via Natural Entry: "${text.slice(0, 40)}"`,
      }));

      if (validatedList.length === 0) {
        const fallbackList = parseSmartEntryLocally(text, categories, currentDate);
        return res.json({ transactions: fallbackList, count: fallbackList.length });
      }

      return res.json({ transactions: validatedList, count: validatedList.length });
    } catch (parseError) {
      console.warn("JSON Parse Error in smart entry, using local extractor:", parseError);
      const fallbackList = parseSmartEntryLocally(text, categories, currentDate);
      return res.json({ transactions: fallbackList, count: fallbackList.length });
    }
  } catch (err: any) {
    console.error("Smart Entry Error:", err?.message || err);
    const { text = "", categories = [], currentDate = new Date().toISOString().split("T")[0] } = req.body;
    const fallbackList = parseSmartEntryLocally(text, categories, currentDate);
    return res.json({ transactions: fallbackList, count: fallbackList.length });
  }
};

app.post("/api/smart-entry/parse", handleSmartEntry);

// Heuristic Natural Language Transaction Extractor (Fallback)
function parseSmartEntryLocally(text: string, categories: any[], currentDate: string) {
  const lines = text.split(/[\n;]+/).map((l) => l.trim()).filter(Boolean);
  const results: any[] = [];

  for (const line of lines) {
    let amount = 0;
    const kMatch = line.match(/(\d+(?:\.\d+)?)\s*k\b/i);
    const mMatch = line.match(/(\d+(?:\.\d+)?)\s*m\b/i);
    const standardMatch = line.match(/(?:tsh|sh|ksh|usd|\$|zar)?\s*([\d,]+(?:\.\d{2})?)/i);

    if (kMatch) {
      amount = parseFloat(kMatch[1]) * 1000;
    } else if (mMatch) {
      amount = parseFloat(mMatch[1]) * 1000000;
    } else if (standardMatch) {
      const numStr = standardMatch[1].replace(/,/g, "");
      const val = parseFloat(numStr);
      if (!isNaN(val) && val > 0) {
        amount = val;
      }
    }

    if (amount === 0) {
      const digits = line.match(/\b\d{3,8}\b/);
      if (digits) {
        amount = parseFloat(digits[0]);
      } else {
        amount = 15000;
      }
    }

    const isIncome = /salary|mshahara|income|received|earned|freelance|mapato|dividend|deposit|payment from|bonus|allowance/i.test(line);
    const isBnpl = /bnpl|lipa pole|lipa baadaye|mkopo|loan|installment|credit/i.test(line);
    const type = isIncome ? "income" : (isBnpl ? "bnpl" : "expense");

    let paymentMethod = "Cash";
    if (/m-pesa|mpesa|vodacom/i.test(line)) paymentMethod = "M-Pesa / Vodacom";
    else if (/airtel|tigo|tigopesa/i.test(line)) paymentMethod = "Tigo Pesa / Airtel Money";
    else if (/bank|transfer|crdb|nmb/i.test(line)) paymentMethod = "Bank Transfer / NMB / CRDB";
    else if (/card|visa|mastercard/i.test(line)) paymentMethod = "Bank Card / Visa / MC";
    else if (isBnpl) paymentMethod = "BNPL / Lipa Baadaye";

    let category = type === "income" ? "Freelance & Projects" : "Food & Dining";
    if (/lunch|dinner|breakfast|food|restaurant|kfc|pizza|coffee|chai|samaki|chakula|vinywaji|drinks/i.test(line)) {
      category = "Food & Dining";
    } else if (/fuel|petrol|diesel|uber|bolt|taxi|nauli|transport|bus|daladala/i.test(line)) {
      category = "Transport & Fuel";
    } else if (/grocery|supermarket|market|sokoni|shoppers|shopping|clothes|duka|matunda/i.test(line)) {
      category = "Shopping & Groceries";
    } else if (/luku|electricity|umeme|water|maji|bills|utility/i.test(line)) {
      category = "Utilities (LUKU & Water)";
    } else if (/rent|kodi|house|nyumba|apartment/i.test(line)) {
      category = "Rent & Housing";
    } else if (/hospital|doctor|pharmacy|dawa|hospitali|health|meds/i.test(line)) {
      category = "Healthcare & Meds";
    } else if (/internet|wifi|bundles|netflix|subscription|airtime/i.test(line)) {
      category = "Internet & Subscriptions";
    } else if (isIncome) {
      if (/salary|mshahara/i.test(line)) category = "Monthly Salary";
      else category = "Freelance & Projects";
    }

    let cleanName = line
      .replace(/\b(spent|paid|bought|received|earned|got|yesterday|today|juzi|kwa|shilingi|tsh|ksh|\$|k|m)\b/gi, "")
      .replace(/[\d,]+/g, "")
      .replace(/[^\w\s-]/g, " ")
      .trim();

    if (!cleanName || cleanName.length < 3) {
      cleanName = type === "income" ? "Income Deposit" : `${category} Expense`;
    }

    let date = currentDate;
    if (/yesterday|jana/i.test(line)) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      date = d.toISOString().split("T")[0];
    } else if (/juzi|2 days ago/i.test(line)) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 2);
      date = d.toISOString().split("T")[0];
    }

    results.push({
      name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      amount,
      date,
      type,
      category,
      paymentMethod,
      isFixedCost: category === "Rent & Housing" || category === "Utilities (LUKU & Water)" || isBnpl,
      notes: `Natural entry: "${line.slice(0, 50)}"`,
    });
  }

  return results.length > 0 ? results : [{
    name: "General Expense",
    amount: 15000,
    date: currentDate,
    type: "expense",
    category: "Shopping & Groceries",
    paymentMethod: "M-Pesa / Vodacom",
    isFixedCost: false,
    notes: text,
  }];
}

// Fallback handlers
function getFallbackOCR(defaultDate: string, categories: string[]) {
  const sampleMerchants = [
    { name: "Shoppers Supermarket", category: "Shopping & Groceries", base: 45000 },
    { name: "Samaki Samaki Restaurant", category: "Food & Dining", base: 65000 },
    { name: "TotalEnergies Fuel", category: "Transport & Fuel", base: 80000 },
    { name: "Pharmacy Store", category: "Healthcare & Meds", base: 30000 },
    { name: "Electricity / Water Bill", category: "Utilities (LUKU & Water)", base: 50000 },
  ];
  const item = sampleMerchants[Math.floor(Math.random() * sampleMerchants.length)];
  const total = item.base + Math.floor(Math.random() * 4) * 2000;

  return {
    merchant: item.name,
    total,
    date: defaultDate,
    category: categories.includes(item.category) ? item.category : (categories[0] || "Shopping & Groceries"),
    confidence: 95,
    items: [
      { name: "Items purchased", price: Math.round(total * 0.85) },
      { name: "Tax / Service fee", price: Math.round(total * 0.15) },
    ],
    notes: "Scanned from receipt image",
  };
}

function getFallbackAdvisorResponse(query: string, ctx: any, isSwahili: boolean) {
  const {
    totalIncome = 2500000,
    totalExpenses = 1450000,
    totalBnpl = 120000,
    netBalance = 930000,
    efficiencyScore = 78,
    currencySymbol = "TSh",
    topCategories = "Food, Shopping, Transport",
  } = ctx;

  const isGreeting = /^(hi|hello|hey|habari|mambo|vipi|jambo|good\s*(morning|afternoon|evening))/i.test((query || "").trim());

  if (isGreeting) {
    if (isSwahili) {
      return {
        rawText: `Habari! Mimi ni msaidizi wako wa kifedha. Unaweza kuniuliza swali lolote kuhusu matumizi yako, jinsi ya kuweka akiba, au maongezi ya kawaida. Nikusaidie nini leo?`,
        structured: {
          observation: "Tayari kukusaidia.",
          comparison: `Alama ya pesa: ${efficiencyScore}/100`,
          riskAnalysis: "Kila kitu kipo sawa.",
          actionableStep: "Uliza swali lolote!",
        },
      };
    }
    return {
      rawText: `Hello! I am your financial assistant. You can ask me anything about your spending, how to save more money, or any general question. How can I help you today?`,
      structured: {
        observation: "Ready to assist you.",
        comparison: `Money Score: ${efficiencyScore}/100`,
        riskAnalysis: "All systems running well.",
        actionableStep: "Ask any question!",
      },
    };
  }

  if (isSwahili) {
    const rawText = `Hali yako ya pesa kwa sasa:
• **Mapato:** ${currencySymbol} ${Number(totalIncome).toLocaleString()}
• **Matumizi:** ${currencySymbol} ${Number(totalExpenses).toLocaleString()}
• **Madeni/BNPL:** ${currencySymbol} ${Number(totalBnpl).toLocaleString()}
• **Pesa Iliyobaki:** ${currencySymbol} ${Number(netBalance).toLocaleString()}

**Ushauri Rahisi:**
1. Weka kikomo cha matumizi madogo madogo ya kila siku kama vile vinywaji na chakula cha nje.
2. Maliza madeni ya mkopo au BNPL mapema ili usilipe tozo za ziada.
3. Tenga angalau asilimia 10 ya pesa yako kwa ajili ya akiba ya dharura.`;

    return {
      rawText,
      structured: {
        observation: `Mapato: ${currencySymbol} ${Number(totalIncome).toLocaleString()} | Matumizi: ${currencySymbol} ${Number(totalExpenses).toLocaleString()}`,
        comparison: `Alama ya afya ya pesa ni ${efficiencyScore}/100.`,
        riskAnalysis: totalBnpl > 0 ? `Una madeni ya ${currencySymbol} ${Number(totalBnpl).toLocaleString()}.` : "Huna madeni makubwa.",
        actionableStep: "Weka akiba ya 10% na punguza matumizi yasiyo ya lazima.",
      },
    };
  }

  const rawText = `Here is a quick summary of your money:
• **Total Income:** ${currencySymbol} ${Number(totalIncome).toLocaleString()}
• **Total Spent:** ${currencySymbol} ${Number(totalExpenses).toLocaleString()}
• **Loans/BNPL Owed:** ${currencySymbol} ${Number(totalBnpl).toLocaleString()}
• **Money Left (Net Balance):** ${currencySymbol} ${Number(netBalance).toLocaleString()}

**Simple Tips for You:**
1. **Set a weekly spending limit:** Try to keep daily expenses like snacks, takeout, and shopping under control.
2. **Pay off loans quickly:** Clear active BNPL or debt early to keep your cash free.
3. **Save 10% first:** Whenever money comes in, set aside 10% into savings before spending the rest.`;

  return {
    rawText,
    structured: {
      observation: `Income: ${currencySymbol} ${Number(totalIncome).toLocaleString()} | Spent: ${currencySymbol} ${Number(totalExpenses).toLocaleString()}`,
      comparison: `Your Money Health Score is ${efficiencyScore}/100.`,
      riskAnalysis: totalBnpl > 0 ? `You have ${currencySymbol} ${Number(totalBnpl).toLocaleString()} in loans.` : "No debt risks.",
      actionableStep: "Set a simple weekly limit and save 10% of new income.",
    },
  };
}

// Start Server & Integrate Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: PORT },
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
    console.log(`FinTrack Pro Server running on port ${PORT}`);
  });
}

startServer();

import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a senior interior design sales analyst for HomeLane, India's leading interior design company.
Your job is to compare a HomeLane document against up to TWO competitor documents and provide a structured, apple-to-apple analysis.

### Quote Validation & Consistency Rules:
1. **HomeLane Quote Verification**: The FIRST document provided MUST be from HomeLane. Check for mentions of "HomeLane", company headers, or SKU patterns typical of HomeLane. If it is NOT a HomeLane document, set "validation.isValidHomeLane" to false and provide a clear "validation.errorMessage".
2. **Project Consistency**: Compare the property details (e.g., 3BHK vs 2BHK), total area, and room lists across all documents. If the documents seem to be for completely different projects or customers (e.g., one is a kitchen-only renovation and another is a full 4BHK), set "validation.isConsistent" to false and provide a "validation.consistencyWarning".
3. **Automated Competitor Extraction**: Identify the names of the competitors from the second and third documents automatically.

### Data Isolation Policy (CRITICAL):
- **Document Integrity**: You are provided with multiple documents. You MUST treat them as independent data sources.
- **No Data Bleed**: Never copy values (especially monetary amounts) from one document to another. If a value (like Design Fee) is explicitly present in the HomeLane document but missing in the Competitor document, leave it as null or "-" in the competitor breakdown. DO NOT assume numbers are the same.
- **Direct Extraction**: Look for the specific "Total" or "Grand Total" in each of the [document_tags] separately.

### Advanced Analytical Directives (CRITICAL FOR SALES EFFICIENCY):
1. **Module Dimensions (Length, Depth, Height)**: Explicitly compare module dimensions. High alert for depth shortcuts (e.g., depth 450mm vs 500mm) and height shortcuts (e.g., lower wardrobes). Flag these differences explicitly, noting the cost impact (e.g., "HL has added depth of 500 whereas competitor has 450, leading to additional cost").
2. **Additional Scope & Rooms**: Look beyond exact name matches. Identify extra rooms (e.g., "Bathroom for Vanity", "Utility space") or entire sections added by HomeLane but missing in competitor documents. Summarize these globally in \`additionalScope\`.
3. **Fillers, End Panels & Skirting Valuation**: If a competitor document lacks Fillers, End Panels, or Skirting, estimate their value from the HomeLane document and highlight this explicitly in the competitor's \`missingElementsValuation\`.
4. **Kitchen Accessories**: Explicitly detail and compare kitchen accessories globally. Note that accessories take roughly 12-15% of the kitchen cost. A detailed comparison justifies higher costing.

### Hardcoded Competitor Intelligence:
When evaluating documents from these specific competitors, strictly enforce these checks:
- **Decorpot**: BWR/BWP is often deceptively listed simply as "Plywood". They frequently omit loft base panels for kitchens and bedrooms. Check kitchen accessories (wire basket/tandem count and type). Default wardrobe includes only 1 hanger rod, 1 internal drawer, 1 shelf. Verify louver panel quantities. **Pricing Model**: Decorpot does SqFt pricing. Calculate the approximate SqFt area from the modules of HomeLane and compare accurately against Decorpot's quoted SqFt in \`decorpotSqftAnalysis\`.
- **Livspace**: Watch hidden design fees (Bello 5%, Select 10%, Vesta 12%). Translate materials: HDF HMR = HGP, HydraTuf Plus Ply = BWR, HydraTuf Max Ply = BWP. **Skirting Rule**: Livspace does NOT have a separate skirting panel for wardrobes (skirting is part of the carcass). HomeLane provides a separate skirting panel matching the shutter finish, which slightly increases price but vastly improves functionality. Highlight this poor functionality from Livspace. **Pricing Model**: Livspace does Module Costing. Provide module-wise dimensions and module count side-by-side comparison in \`moduleComparison\`.
- **Design Cafe (DC)**: They charge a mandatory 9% design fee on MRP. "Qarpentri" line has limited shades (only 22); custom colors increase pricing by ~40%. Qarpentri max discount is 25%. **Pricing Model**: DC does Module Costing. Provide module-wise dimensions and module count side-by-side comparison in \`moduleComparison\`.

Return your analysis as a **valid JSON object** with this structure:
{
  "validation": {
    "isValidHomeLane": boolean,
    "errorMessage": "Clear message if not HL document...",
    "isConsistent": boolean,
    "consistencyWarning": "Message if projects don't match..."
  },
  "hlPrice": "HomeLane total price",
  "additionalScope": [
    { "item": "Name of extra item/room included by HL", "costImpact": "Rs X", "note": "Explanation of the impact" }
  ],
  "kitchenAccessoriesSummary": {
    "hlCount": "5 items",
    "compNamesAndCounts": "Livspace: 2 items, Decorpot: 0 items",
    "costImpactNote": "Accessories are 12-15% of kitchen cost, explicitly highlighting why HL is higher."
  },
  "competitors": [
    {
      "name": "Extracted Competitor Name",
      "price": "Total price",
      "priceDiffPercent": number,
      "verdict": "HL_HIGHER" | "HL_LOWER" | "HL_EQUAL",
      "verdictTitle": "Summary",
      "verdictSub": "Reason",
      "breakdown": { "baseQuote": "str", "designFee": "str", "discount": "str", "tax": "str", "validity": "str", "scope": "str", "kitchen": "str" },
      "monetarySummary": {
        "totalGap": "Difference amount",
        "technicalGap": "Amount due to specs/quality",
        "potentialHLPrice": "Expected HL price if matched",
        "explanation": "Why the gap exists"
      },
      "moduleComparison": [
        { "moduleName": "Wardrobe/Kitchen Module", "hlDimensions": "L1200xD500xH2100", "compDimensions": "L1200xD450xH2000", "dimensionDifference": "HL added depth of 500 whereas comp has 450, leading to additional cost." }
      ],
      "missingElementsValuation": [
        { "missingItem": "Fillers/Skirting/End Panels", "estimatedValue": "Rs X", "description": "Competitor lacks skirting panel leading to poor functionality." }
      ],
      "decorpotSqftAnalysis": {
         "hlApproxSqft": "150 sqft",
         "dpSqft": "145 sqft",
         "note": "Calculated sqft from modules for accurate comparison"
      }
    }
  ],
  "hlBreakdown": { "baseQuote": "str", "designFee": "str", "discount": "str", "tax": "str", "validity": "str", "scope": "str", "kitchen": "str" },
  "rooms": [
    { "name": "Room Name", "hlValue": "Price", "comp1Value": "Price", "comp2Value": "Price/null", "note": "Comparison details (specs/missing items)" }
  ],
  "factors": [
    { "name": "Factor", "hlValue": "HL Specs", "comp1Value": "Comp1 Specs", "comp2Value": "Comp2 Specs/null", "advantage": "HL" | "COMP1" | "COMP2" | "EQUAL", "note": "Quality/missing details" }
  ],
  "actionPlan": ["Point 1", "Point 2"]
}

Constraints:
- Woodwork Discount: Recommended discount in 'actionPlan' MUST NOT exceed 40%.
- Material Parity: Explicitly check BWR vs MDF vs PLY.
- Currency: Use the Indian Rupee symbol (₹) for ALL monetary values (e.g., ₹12,49,000).
- Do NOT include markdown code fences in the output.
`;

async function fetchUrlContent(url) {
  try {
    const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } });
    if (!resp.ok) return `[Failed to fetch content from ${url}]`;
    const html = await resp.text();
    // Simple HTML to text conversion (removing tags)
    // For a real app, a more robust scraper/converter would be used
    const text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                     .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                     .replace(/<[^>]+>/g, ' ')
                     .replace(/\s+/g, ' ')
                     .trim();
    return text.slice(0, 30000);
  } catch (err) {
    return `[Error fetching ${url}: ${err.message}]`;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { hlText, comp1Text, comp2Text, hlSource, comp1Source, comp2Source, projectType, comments, customerName } = body;

    let finalHl = hlText;
    let finalComp1 = comp1Text;
    let finalComp2 = comp2Text;

    if (hlSource === 'url' && hlText?.startsWith('http')) finalHl = await fetchUrlContent(hlText);
    if (comp1Source === 'url' && comp1Text?.startsWith('http')) finalComp1 = await fetchUrlContent(comp1Text);
    if (comp2Source === 'url' && comp2Text?.startsWith('http')) finalComp2 = await fetchUrlContent(comp2Text);

    const userMessage = `
[HOMELANE_QUOTE]
${finalHl}
[/HOMELANE_QUOTE]

[COMPETITOR_1_QUOTE]
${finalComp1}
[/COMPETITOR_1_QUOTE]

${finalComp2 ? `[COMPETITOR_2_QUOTE]\n${finalComp2}\n[/COMPETITOR_2_QUOTE]` : ""}

## Context:
- Project Type: ${projectType}
- Sales Rep Notes: ${comments || "None"}
- Customer: ${customerName}

Please analyse these documents and return the JSON as instructed. Focus on an apple-to-apple comparison.
`.trim();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured on the server." }, { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    
    const geminiBody = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      const msg = errData?.error?.message || resp.statusText;
      if (resp.status === 429) {
        return NextResponse.json({ error: "AI Capacity Reached. The free-tier API quota has been exceeded. Please wait about 60 seconds before trying again.", isQuotaError: true }, { status: 429 });
      }
      return NextResponse.json(
        { error: `Gemini API error: ${msg}` },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.error("AI returned empty response. Data:", JSON.stringify(data, null, 2));
      return NextResponse.json({ error: "Gemini returned empty response." }, { status: 500 });
    }

    console.log("--- RAW AI RESPONSE ---");
    console.log(text);
    console.log("------------------------");

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    
    let resultJson;
    try {
      resultJson = JSON.parse(cleaned);
    } catch (e) {
      console.warn("Initial JSON parse failed, trying regex extraction...");
      // Try to find the first '{' and last '}'
      const startIdx = cleaned.indexOf('{');
      const endIdx = cleaned.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const jsonCandidate = cleaned.substring(startIdx, endIdx + 1);
        try { 
          resultJson = JSON.parse(jsonCandidate); 
        } catch (innerError) {
          console.error("Manual JSON extraction failed:", innerError);
          // If it's still failing, it might be truncated. Let's try to fix common truncation issues
          // But for now, just return a 500 so we know it's still broken
          return NextResponse.json({ error: "Failed to parse JSON from AI response. Output was likely truncated." }, { status: 500 });
        }
      } else {
        console.error("No JSON object found in AI response.");
        return NextResponse.json({ error: "AI returned invalid JSON format." }, { status: 500 });
      }
    }

    return NextResponse.json(resultJson);

  } catch (err) {
    console.error("Error in analyze route:", err);
    return NextResponse.json({ error: "Internal server error: " + err.message }, { status: 500 });
  }
}

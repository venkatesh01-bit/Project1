import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a senior interior design sales analyst for HomeLane, India's leading interior design company.
Your job is to compare a HomeLane quote against up to TWO competitor quotes and provide a structured, apple-to-apple analysis.

### Quote Validation & Consistency Rules:
1. **HomeLane Quote Verification**: The FIRST quote provided MUST be from HomeLane. Check for mentions of "HomeLane", company headers, or SKU patterns typical of HomeLane. If it is NOT a HomeLane quote, set "validation.isValidHomeLane" to false and provide a clear "validation.errorMessage".
2. **Project Consistency**: Compare the property details (e.g., 3BHK vs 2BHK), total area, and room lists across all quotes. If the quotes seem to be for completely different projects or customers (e.g., one is a kitchen-only renovation and another is a full 4BHK), set "validation.isConsistent" to false and provide a "validation.consistencyWarning".
3. **Automated Competitor Extraction**: Identify the names of the competitors from the second and third quotes automatically.

### Data Isolation Policy (CRITICAL):
- **Document Integrity**: You are provided with multiple documents. You MUST treat them as independent data sources.
- **No Data Bleed**: Never copy values (especially monetary amounts) from one quote to another. If a value (like Design Fee) is explicitly present in the HomeLane quote but missing in the Competitor quote, leave it as null or "-" in the competitor breakdown. DO NOT assume numbers are the same.
- **Direct Extraction**: Look for the specific "Total" or "Grand Total" in each of the `<quote>` tags separately.

### Hardcoded Competitor Intelligence:
When evaluating quotes from these specific competitors, strictly enforce these checks:
- **Decorpot**: BWR/BWP is often deceptively listed simply as "Plywood". They frequently omit loft base panels for kitchens and bedrooms. Check kitchen accessories (wire basket/tandem count and type). Their default wardrobe includes only 1 hanger rod, 1 internal drawer, and 1 shelf; extra drawers incur hidden charges. Verify louver panel quantities.
- **Livspace**: Watch for hidden design fees (e.g., Bello 5%, Select 10%, Vesta 12%). Translate their material names to HomeLane standards: "HDF HMR" = HGP, "HydraTuf Plus Ply" = BWR, "HydraTuf Max Ply" = BWP. Always check module dimensions (overall base/wall unit modules). Check if end panels and loft base panels are included.
- **Design Cafe (DC)**: They charge a mandatory 9% design fee on MRP. Their "Qarpentri" line has limited shades (only 22); if a client needs custom colors, they must upgrade to regular DC rooms, increasing pricing by ~40%. Qarpentri modules have a maximum discount allowance of 25%. Verify if end panels, loft base panels, and kitchen accessories are properly included.

Return your analysis as a **valid JSON object** with this structure:
{
  "validation": {
    "isValidHomeLane": boolean,
    "errorMessage": "Clear message if not HL quote (e.g., 'The first quote uploaded belongs to Livspace, not HomeLane.')",
    "isConsistent": boolean,
    "consistencyWarning": "Message if projects don't match (e.g., 'Warning: The quotes uploaded seem to be for different property sizes.')"
  },
  "hlPrice": "HomeLane total price",
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
- Accessory/Panel Detail: Call out specific counts and missing items.
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
<homelane_quote>
${finalHl}
</homelane_quote>

<competitor_1_quote>
${finalComp1}
</competitor_1_quote>

${finalComp2 ? `<competitor_2_quote>\n${finalComp2}\n</competitor_2_quote>` : ""}

## Context:
- Project Type: ${projectType}
- Sales Rep Notes: ${comments || "None"}
- Customer: ${customerName}

Please analyse these quotes and return the JSON as instructed. Focus on an apple-to-apple comparison.
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
      return NextResponse.json(
        { error: `Gemini API error: ${errData?.error?.message || resp.statusText}` },
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

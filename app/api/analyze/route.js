import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a senior interior design sales analyst for HomeLane, India's leading interior design company.
Your job is to compare two interior design quotes — one from HomeLane and one from a competitor — and provide a structured, honest, apple-to-apple analysis.

You must return your analysis as a **valid JSON object** with the following exact structure:
{
  "hlPrice": "extracted HomeLane total price as string, e.g. ₹18,50,000",
  "compPrice": "extracted competitor total price as string",
  "priceDiffPercent": number (positive = HL is higher, negative = HL is lower),
  "verdict": "HL_HIGHER" | "HL_LOWER" | "HL_EQUAL",
  "verdictTitle": "one-line summary",
  "verdictSub": "2-3 sentence explanation of the key reason for the difference",
  "hlBreakdown": {
    "baseQuote": "string",
    "designFee": "string",
    "discount": "string",
    "tax": "string",
    "validity": "string",
    "scope": "string",
    "kitchen": "string"
  },
  "compBreakdown": {
    "baseQuote": "string",
    "designFee": "string",
    "discount": "string",
    "tax": "string",
    "validity": "string",
    "scope": "string",
    "kitchen": "string"
  },
  "rooms": [
    {
      "name": "Room Name, e.g. Master Bedroom",
      "hlValue": "HL Price for this room",
      "compValue": "Competitor Price for this room",
      "note": "detailed 'why' — size diff, module diff, quality, or extra products"
    }
  ],
  "factors": [
    {
      "name": "Factor name, e.g. Modular Kitchen",
      "hlValue": "What HomeLane quote includes",
      "compValue": "What competitor quote includes",
      "advantage": "HL" | "COMP" | "EQUAL",
      "note": "Brief explanation of the difference"
    }
  ],
  "actionPlan": [
    "Bullet point 1",
    "Bullet point 2"
  ]
}

Rules:
Assume the customer considers all brands equal and winning the order is based strictly on who is providing a lower quote. Provide actionable pointers in 'actionPlan' as short bullet points avoiding long text. Follow this logic:
1. Compare if all modules are comparable and apple-to-apple same specs are matched.
2. If NOT exactly matched, highlight these points FIRST:
   - Identify if HomeLane has modules that are not there in the competitor quote.
   - If HomeLane uses higher quality material for certain rooms compared to competitors, state that the quote needs to be changed to the same material to match the competitive price.
   - Point out if module sizes are different in the same room, leading to price differences.
   - Point out if HomeLane missed adding some products that the competitor added, and advise fixing them.
3. If specs, modules, sizes, and products ARE exactly the same, but HomeLane prices are higher:
   - Recommend increasing the woodwork discount (up to a max of 40%) to close the gap.
   - If even after a 40% woodwork discount the HomeLane quote is still higher, calculate the final remaining price difference for the sales person to address as a standalone gap.
- Do NOT include markdown formatting inside the JSON string values.
- Keep factor names concise (max 4 words).
`;

export async function POST(request) {
  try {
    const body = await request.json();
    const { hlText, compText, competitor, projectType, customerName, comments } = body;

    const userMessage = `
## HomeLane Quote:
${hlText}

## ${competitor} (Competitor) Quote:
${compText}

## Context:
- Project Type: ${projectType}
- Customer Name: ${customerName || "Not specified"}
- Competitor: ${competitor}
- Sales Rep Notes: ${comments || "None"}

Please analyse these two quotes and return the JSON as instructed.
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

import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

const SYSTEM_PROMPT = `You are a senior interior design sales analyst for HomeLane, India's leading interior design company.
Your job is to compare a HomeLane document against up to TWO competitor documents and provide a structured, apple-to-apple analysis.

### Quote Validation & Consistency Rules:
1. **HomeLane Quote Verification**: The FIRST document provided MUST be from HomeLane. Check for mentions of "HomeLane", company headers, or SKU patterns typical of HomeLane. If it is NOT a HomeLane document, set "validation.isValidHomeLane" to false and provide a clear "validation.errorMessage".
2. **Project Consistency**: Compare the property details (e.g., 3BHK vs 2BHK), total area, and room lists across all documents. If the documents seem to be for completely different projects or customers (e.g., one is a kitchen-only renovation and another is a full 4BHK), set "validation.isConsistent" to false and provide a "validation.consistencyWarning".
3. **Automated Competitor Extraction**: Identify the names of the competitors from the second and third documents automatically.

### Data Isolation Policy (CRITICAL):
- **Document Integrity**: You are provided with multiple documents. You MUST treat them as independent data sources.
- **HomeLane Pricing Rule (Net vs MRP)**: For the HomeLane quote, always extract and use the **Final Net Price (Total After Discount)** as 'hlPrice' and as the basis for the HomeLane total comparison, rather than the pre-discount Subtotal/Total Quote Price (MRP). This ensures you compare the actual final payable price (after discount) against competitor quotes. For competitors, ensure you are also comparing their final payable price (after all applicable discounts).
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

### HomeLane Proposal Value & Design Optimization Opportunities:
Analyze the HomeLane quote and identify opportunities to optimize the design/specifications to lower HomeLane's price and win the deal. Suggest up to 3 high-impact optimizations from the following categories if applicable, and return them in 'hlOptimisations' array:
1. **Fitted Furniture (Modular)**:
   - **Construction Type**: Hinged/Sliding/Floor-to-Ceiling Wardrobes, Entertainment/Crockery/Foyer Units, Suspended/Floor Standing Vanity Units can be optimized by 10% by changing construction to "Fusion" (except Fillers, Shelves, Countertops, Skirting, Panels, Lofts). Note that Cabinet Material is a % of product cost (e.g., Room Divider: 5% Cab / 95% Shutter, Entertainment/Crockery/Foyer/Hinged: 76% Cab / 24% Shutter, Sliding: 35% Cab / 65% Shutter).
   - **Cabinet Material**: BWP Ply (100%) > Hydroguard Plus HDF (85%) > Prelam BWR / Prelam Comply (75%) > Prelam Hydroguard Plus-HDF (66%) > Prelam AQS MDF-Clr-BSL / Prelam AQS MDF-R / AQS-MDF-R (60%) > Prelam AQS MDF-R (49%). Suggest only up to 2 tiers down.
   - **Shutter Finish/Core**: PU OSL > Membrane OSL > Acrylic OSL > Postlam > Prelam. (Membrane must be MDF core, Acrylic/PU must be HDHMR). Aluminium Glass Shutter can be optimized to 19mm Alu Profile (saves 10%). Suggest up to 3 levels down.
2. **Painting**:
   - Built-Up Area to Carpet Area = 75%. Painting quantity (sft) = 3 * Carpet Area (if no False Ceiling or with Paint SKU). If False Ceiling without Paint SKU: 3 * Carpet Area + FC Area.
   - Quality Tiers: Royale (100%) > Apcolite (80%) > Tractor (70%).
3. **Electrical**:
   - Basic vs False Ceiling Electrical package based on City and Property Config (1BHK-4BHK). Select basic or false ceiling package depending on ceiling presence (e.g., Bangalore 2BHK Basic is ₹28,545, FC is ₹40,779; Chennai 3BHK Basic is ₹34,829, FC is ₹49,756).
4. **False Ceiling**:
   - Signature Gyproc Standard (100%) > Classic Knauf (90%) > Essential Knauf 0.3mm (65%).
5. **Countertops**:
   - Installation: With Backsplash + 40mm Nosing (100%) > Without Backsplash + 40mm Nosing (95%) > With Backsplash + 20mm Nosing (80%) > Without Backsplash + 20mm Nosing (75%).
   - Material: Kalinga (100%) > Camrola or AGL (90%) > Granite (50%).

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
  "actionPlan": ["Point 1", "Point 2"],
  "hlOptimisations": [
    { "category": "Modular / Painting / Electrical / False Ceiling / Countertop", "current": "Current Specification", "recommended": "Recommended Specification", "savings": "₹ X", "note": "Reasoning from the rulebook" }
  ]
}

Constraints:
- Woodwork Discount: Recommended discount in 'actionPlan' MUST NOT exceed 40%.
- Material Parity: Explicitly check BWR vs MDF vs PLY.
- Currency: Use the Indian Rupee symbol (₹) for ALL monetary values (e.g., ₹12,49,000).
- Do NOT include markdown code fences in the output.
`;

async function fetchUrlContent(url) {
  try {
    let encryptedKey = null;
    let projectId = null;
    let propData = {};

    // Check if it is a HomeLane quote share URL
    if (url.includes('homelane.com/sc-quotes-share/')) {
      const keyMatch = url.match(/\/sc-quotes-share\/([^/?#]+)/);
      if (keyMatch && keyMatch[1]) {
        encryptedKey = keyMatch[1];
        
        // Fetch user property details to get the project_id
        const rosterUrl = `https://rosters.homelane.com/apis/general/fetchUserPropertyDetails?key=${encryptedKey}&isProCust=1`;
        const propResp = await fetch(rosterUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!propResp.ok) {
          throw new Error(`Failed to fetch property details (Status: ${propResp.status})`);
        }
        propData = await propResp.json();
        projectId = propData.project_id;
      }
    } else if (url.includes('homelane.com/sc-quotes/')) {
      const projectMatch = url.match(/\/sc-quotes\/([^/?#]+)/);
      if (projectMatch && projectMatch[1]) {
        projectId = projectMatch[1];
      }
    }

    if (projectId) {
        // Fetch the detailed quote
        const scUrl = `https://sc-backend-production.homelane.com/api/v1.0/detailedQuote/${projectId}`;
        const quoteResp = await fetch(scUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Authorization': 'eyJhbGciOiJIUzUxMiJ9.eyJyb2xlIjoiUk9MRV9ST1NURVIiLCJvcGVuIjp0cnVlLCJ1c2VybmFtZSI6InJvc3Rlci1zZXJ2aWNlIiwic3ViIjoicm9zdGVyLXNlcnZpY2UiLCJpYXQiOjE3MDIwMzcyMzcsImV4cCI6MTg1OTcxNzIzN30.X7HhD-eIEvGu2yxRD724a1ivzfYklifFj3L_TsCVgMYHrldpUrEmWTcpDoYGTY5GHQ2bjEUEipIvY5uRin6WMQ'
          }
        });
        
        if (!quoteResp.ok) {
          throw new Error(`Failed to fetch detailed quote (Status: ${quoteResp.status})`);
        }
        const quoteData = await quoteResp.json();
        
        const serviceCharges = quoteData.projectSummary?.discountData?.serviceCharges || quoteData.projectSummary?.serviceChargeCapValue || 0;
        
        let validityStr = "N/A";
        if (quoteData.publishDate && quoteData.quoteValidityDate) {
          const publishDate = new Date(quoteData.publishDate);
          const expiryDate = new Date(quoteData.publishDate + quoteData.quoteValidityDate);
          const formatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
          const pubStr = publishDate.toLocaleDateString('en-IN', formatOptions);
          const expStr = expiryDate.toLocaleDateString('en-IN', formatOptions);
          const diffDays = Math.round(quoteData.quoteValidityDate / (1000 * 60 * 60 * 24));
          validityStr = `Valid until ${expStr} (${diffDays} days from publish date ${pubStr})`;
        }
        
        // 3. Construct a beautiful, highly detailed markdown representation of the quote for the LLM
        let md = `# HomeLane Online Quote Details\n\n`;
        md += `**Customer Name:** ${propData.customer_profile?.name || quoteData.name || 'Unknown'}\n`;
        md += `**Project ID:** ${projectId}\n`;
        md += `**Property config:** ${quoteData.propertyConfig || propData.property?.property_config || 'N/A'}\n`;
        md += `**Property name/address:** ${propData.property?.property_name || 'N/A'} - ${propData.property?.property_address || 'N/A'}\n`;
        const totalVal = quoteData.projectSummary?.total || 0;
        const discountVal = quoteData.projectSummary?.discount || 0;
        const netPriceVal = totalVal - discountVal;

        md += `**Total Quote Price (MRP):** ₹ ${totalVal}\n`;
        md += `**SubTotal:** ₹ ${quoteData.projectSummary?.subTotal || 'N/A'}\n`;
        md += `**Discount:** ₹ ${discountVal}\n`;
        md += `**Final Net Price (Total After Discount - customer pays this):** ₹ ${netPriceVal}\n`;
        md += `**GST/Tax:** ₹ ${quoteData.projectSummary?.gstTax || 'N/A'}\n`;
        md += `**Design & Management Fee (Service Charges):** ₹ ${serviceCharges}\n`;
        md += `**Quote Validity / Expiry:** ${validityStr}\n\n`;
        
        const rooms = quoteData.projectSummary?.rooms || [];
        md += `## ROOMS & CATEGORIES BREAKDOWN (${rooms.length} rooms):\n\n`;
        
        for (const room of rooms) {
          md += `### Room: ${room.roomName} (${room.roomType}) - Price: ₹ ${room.price}\n`;
          
          // Fitted Furniture / Woodwork
          const ffData = room.fittedFurniture?.data || [];
          if (ffData.length > 0) {
            md += `#### Fitted Furniture / Woodwork:\n`;
            for (const item of ffData) {
              md += `- **Module:** ${item.name} (Total Price: ₹ ${item.price})\n`;
              const subCats = item.subCategories || [];
              for (const sc of subCats) {
                const subItems = sc.items || [];
                for (const subItem of subItems) {
                  const prod = subItem.product || {};
                  md += `  - **Item Name:** ${subItem.name} | Dims: ${subItem.dimension || prod.dimension || 'N/A'} | Qty: ${subItem.quantity} | Price: ₹ ${subItem.price}\n`;
                  
                  const cabinet = subItem.details?.cabinet || subItem.cabinet || '';
                  const hinges = subItem.details?.hingeMake || subItem.hingeMake || '';
                  const softClose = subItem.details?.hingeSoftClose || (subItem.hingeSoftClose ? 'Yes' : 'No');
                  if (cabinet) md += `    - Cabinet/Carcass: ${cabinet}\n`;
                  if (hinges) md += `    - Hinges/Hardware: ${hinges} (Soft Close: ${softClose})\n`;
                  
                  const shutters = subItem.details?.shutters || subItem.shutters || [];
                  if (shutters.length > 0) {
                    md += `    - Shutters Finish/Core:\n`;
                    for (const sh of shutters) {
                      md += `      * ${sh.name} (Core: ${sh.coreName}, Finish: ${sh.finishName}, Color: ${sh.color})\n`;
                    }
                  }
                  
                  const accs = subItem.accessories || [];
                  if (accs.length > 0) {
                    md += `    - Accessories:\n`;
                    for (const ac of accs) {
                      md += `      * Name: ${ac.name} (Qty: ${ac.quantity}, Make: ${ac.tcMake || ac.make || 'N/A'}, Price: ₹ ${ac.price})\n`;
                    }
                  }
                }
              }
            }
          }
          
          // Services
          const srvData = room.services?.data || [];
          if (srvData.length > 0) {
            md += `#### Services:\n`;
            for (const item of srvData) {
              md += `- **Service Category:** ${item.name} (Price: ₹ ${item.price})\n`;
              for (const sub of item.items || []) {
                const prod = sub.product || {};
                md += `  - **Service:** ${sub.name} (Qty: ${sub.quantity || 'N/A'}, Price: ₹ ${sub.price})\n`;
                if (prod.description) md += `    - Description: ${prod.description.replace(/<[^>]+>/g, ' ')}\n`;
                if (sub.length || sub.width || sub.height) {
                  md += `    - Dimensions: L ${sub.length} x W ${sub.width} x H ${sub.height}\n`;
                }
              }
            }
          }
          
          // Appliances
          const appData = room.appliances?.data || [];
          if (appData.length > 0) {
            md += `#### Appliances / HDS / Extras:\n`;
            for (const item of appData) {
              md += `- **Item:** ${item.name} (Price: ₹ ${item.price})\n`;
              for (const sub of item.items || []) {
                md += `  - ${sub.name} (Qty: ${sub.quantity || 'N/A'}, Price: ₹ ${sub.price})\n`;
              }
            }
          }
          
          // Loose Furniture
          const looseData = room.looseFurniture?.data || [];
          if (looseData.length > 0) {
            md += `#### Loose Furniture:\n`;
            for (const item of looseData) {
              md += `- **Item:** ${item.name} (Price: ₹ ${item.price})\n`;
              for (const sub of item.items || []) {
                md += `  - ${sub.name} (Qty: ${sub.quantity || 'N/A'}, Price: ₹ ${sub.price})\n`;
              }
            }
          }
          
          md += `\n`;
        }
        
        return md;
      }
  } catch (err) {
    return `[Error fetching ${url}: ${err.message}]`;
  }
}

async function fetchRegularUrlContent(url) {
  try {
    const resp = await fetch(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      } 
    });
    if (!resp.ok) return `[Failed to fetch content from ${url}]`;
    const html = await resp.text();
    
    let extractedData = "";

    // 1. Try to extract Next.js __NEXT_DATA__ state which usually has the full API payloads
    const nextDataRegex = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i;
    const nextDataMatch = html.match(nextDataRegex);
    if (nextDataMatch && nextDataMatch[1]) {
      try {
        const parsed = JSON.parse(nextDataMatch[1].trim());
        extractedData += "\n[Extracted Next.js Page Data]\n" + JSON.stringify(parsed, null, 2) + "\n";
      } catch (e) {
        // Skip malformed JSON
      }
    }

    // 2. Try to extract other script tags containing state objects (like window.__INITIAL_STATE__ etc)
    const genericScriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = genericScriptRegex.exec(html)) !== null) {
      const scriptContent = match[1].trim();
      if (!scriptContent) continue;
      
      const contentLower = scriptContent.toLowerCase();
      if (
        contentLower.includes("quote") || 
        contentLower.includes("price") || 
        contentLower.includes("discount") || 
        contentLower.includes("carcass") || 
        contentLower.includes("shutter")
      ) {
        // Look for JSON object patterns within the script
        const jsonMatch = scriptContent.match(/(\{[\s\S]*?\})/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            extractedData += "\n[Extracted Script State Data]\n" + JSON.stringify(parsed, null, 2) + "\n";
          } catch (e) {
            extractedData += "\n[Extracted Script Raw Code]\n" + scriptContent.slice(0, 3000) + "\n";
          }
        } else {
          extractedData += "\n[Extracted Script Raw Code]\n" + scriptContent.slice(0, 3000) + "\n";
        }
      }
    }

    // 3. Simple HTML to text conversion (removing tags) for plain visible text
    const textBody = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                         .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                         .replace(/<[^>]+>/g, ' ')
                         .replace(/\s+/g, ' ')
                         .trim();
    
    return (textBody + "\n" + extractedData).slice(0, 50000);
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
    if (comp1Source === 'url' && comp1Text?.startsWith('http')) {
      finalComp1 = comp1Text.includes('homelane.com') ? await fetchUrlContent(comp1Text) : await fetchRegularUrlContent(comp1Text);
    }
    if (comp2Source === 'url' && comp2Text?.startsWith('http')) {
      finalComp2 = comp2Text.includes('homelane.com') ? await fetchUrlContent(comp2Text) : await fetchRegularUrlContent(comp2Text);
    }

    const hasCompetitor = (finalComp1 && finalComp1.trim().length > 0 && !finalComp1.includes('[Failed to fetch')) || 
                          (finalComp2 && finalComp2.trim().length > 0 && !finalComp2.includes('[Failed to fetch'));

    let dynamicSystemPrompt = SYSTEM_PROMPT;

    if (!hasCompetitor) {
      // Modify systemic instructions to optimize HomeLane quote only
      dynamicSystemPrompt = SYSTEM_PROMPT + `\n\n### IMPORTANT NOTICE: NO COMPETITOR QUOTE IS PRESENT.
You must run in **OPTIMIZATION-ONLY MODE**:
1. Focus entirely on analyzing the HomeLane quote and suggesting up to 3 high-impact optimization recommendations (cabinet core, finishes, painting, false ceiling, countertops, etc.) to optimize proposal pricing in 'hlOptimisations'.
2. Set 'competitors' array to an empty array [].
3. For 'rooms' array, populate room details with only the HomeLane pricing ('hlValue') and note down specific layout observations or where you think pricing is high. Leave competitor values as null/'-'.
4. For 'factors' array, list the factors for HomeLane woodwork/specifications. Leave competitor values as null/'-'.
5. Populate 'actionPlan' with specific strategies for the sales rep to pitch this proposal, convince the client of HomeLane's quality, and close the deal.`;
    } else {
      dynamicSystemPrompt = SYSTEM_PROMPT + `\n\n### IMPORTANT NOTICE: COMPETITOR QUOTE IS PRESENT.
You must run in **COMPARISON & BEAT-COMPETITOR MODE**:
1. Identify all gaps, discrepancies, and missed scopes between HomeLane and the competitor quotes.
2. Provide strategic counter-arguments and specific opportunities in 'hlOptimisations' and 'actionPlan' to reduce HomeLane's price to beat the competitor quote while ensuring robust sales closing strategies.`;
    }

    const userMessage = `
[HOMELANE_QUOTE]
${finalHl}
[/HOMELANE_QUOTE]

${finalComp1 ? `[COMPETITOR_1_QUOTE]\n${finalComp1}\n[/COMPETITOR_1_QUOTE]` : ""}

${finalComp2 ? `[COMPETITOR_2_QUOTE]\n${finalComp2}\n[/COMPETITOR_2_QUOTE]` : ""}

## Context:
- Project Type: ${projectType}
- Sales Rep Notes: ${comments || "None"}
- Customer: ${customerName}
- Analysis Mode: ${hasCompetitor ? "Comparison & Beat Competitor" : "Optimization Only"}

Please analyse these documents and return the JSON as instructed.
`.trim();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured on the server." }, { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    
    const geminiBody = {
      systemInstruction: { parts: [{ text: dynamicSystemPrompt }] },
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

    // Persist to Database (Neon/PostgreSQL)
    try {
      await prisma.comparison.create({
        data: {
          customerName: customerName || "Unknown",
          projectType: projectType || "Unknown",
          hlPrice: resultJson.hlPrice || "₹ 0",
          resultJson: resultJson
        }
      });
    } catch (dbErr) {
      console.error("Database save failed:", dbErr);
      // We don't fail the entire request if DB save fails, but we should log it
    }

    return NextResponse.json(resultJson);

  } catch (err) {
    console.error("Error in analyze route:", err);
    return NextResponse.json({ error: "Internal server error: " + err.message }, { status: 500 });
  }
}

"use client";

import { useState, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const COMPETITORS = ["Livspace", "Design Cafe", "NoBroker Interior", "Decorpot", "Truww", "Other"];

export default function ComparePage() {
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, compare, results
  const [history, setHistory] = useState([]);
  const [currentResult, setCurrentResult] = useState(null);
  
  // Dashboard stats
  const totalComparisons = history.length;
  const hlLowerCount = history.filter(h => h.verdict === "HL_LOWER" || h.verdict === "HL_EQUAL").length;
  const hlHigherCount = history.filter(h => h.verdict === "HL_HIGHER").length;

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    const saved = localStorage.getItem("hl_comparisons_next");
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch {}
    }
    // Check for shared result in URL
    try {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get("result");
      if (encoded) {
        const decoded = JSON.parse(decodeURIComponent(atob(encoded)));
        setCurrentResult(decoded);
        setActiveTab("results");
      }
    } catch {}
  }, []);

  const saveHistory = (newHistory) => {
    setHistory(newHistory);
    localStorage.setItem("hl_comparisons_next", JSON.stringify(newHistory.slice(-50)));
  };

  const renderDashboard = () => (
    <div className="page active" id="page-dashboard">
      <nav className="navbar glass-nav">
        <div className="nav-left">
          <div className="logo-mark sm">HL</div>
          <span className="nav-brand">Sales Intelligence</span>
        </div>
        <div className="nav-right">
          <div className="user-chip">
            <span id="user-name">Sales Team</span>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="hero-section">
          <div className="hero-tag">Quote Intelligence</div>
          <h1 className="hero-title">Compare. Win. Deliver.</h1>
          <p className="hero-sub">Hey HomeLane Champs! Compare quotes, identify gaps, and get winning sales strategies instantly.</p>
          <button className="btn btn-primary btn-xl" onClick={() => setActiveTab("compare")}>
            + New Comparison
          </button>
        </div>

        <div className="stats-row">
          <div className="stat-card glass-card">
            <div className="stat-icon">📊</div>
            <div>
              <div className="stat-num">{totalComparisons}</div>
              <div className="stat-label">Total Comparisons</div>
            </div>
          </div>
          <div className="stat-card glass-card" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
            <div className="stat-icon">🏆</div>
            <div>
              <div className="stat-num" style={{ color: '#22c55e' }}>{hlLowerCount}</div>
              <div className="stat-label">HomeLane Won (Price)</div>
            </div>
          </div>
          <div className="stat-card glass-card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
            <div className="stat-icon">⚠️</div>
            <div>
              <div className="stat-num" style={{ color: '#ef4444' }}>{hlHigherCount}</div>
              <div className="stat-label">Competitor Won (Price)</div>
            </div>
          </div>
        </div>

        <div className="history-section">
          <h3 className="section-title">Recent Comparisons</h3>
          <div className="history-list">
            {history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <p>No comparisons yet. Click "New Comparison" to get started.</p>
              </div>
            ) : (
              [...history].reverse().map((item, i) => (
                <div key={i} className="history-item glass-card" onClick={() => {
                  setCurrentResult(item);
                  setActiveTab("results");
                }}>
                  <div className="hi-left">
                    <div className="hi-title">{item.meta.customerName || "Unnamed"} vs {item.meta.competitor}</div>
                    <div className="hi-meta">{item.meta.projectType} · {item.date}</div>
                  </div>
                  <div className="hi-right">
                    <span className={`verdict-pill ${item.verdict === 'HL_HIGHER' ? 'higher' : item.verdict === 'HL_LOWER' ? 'lower' : 'equal'}`}>
                      {item.verdict === 'HL_HIGHER' ? 'HL Higher' : item.verdict === 'HL_LOWER' ? 'HL Lower' : 'Price Match'}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <>
      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "compare" && <CompareForm onBack={() => setActiveTab("dashboard")} onComplete={(res) => {
        const newHistory = [...history, res];
        saveHistory(newHistory);
        setCurrentResult(res);
        setActiveTab("results");
      }}/>}
      {activeTab === "results" && currentResult && <ResultsView result={currentResult} onBack={() => setActiveTab("dashboard")} onNew={() => setActiveTab("compare")}/>}
    </>
  );
}

function CompareForm({ onBack, onComplete }) {
  const [competitor, setCompetitor] = useState(COMPETITORS[0]);
  const [otherComp, setOtherComp] = useState("");
  const [projectType, setProjectType] = useState("3BHK");
  const [customerName, setCustomerName] = useState("");
  const [comments, setComments] = useState("");

  const [hlMode, setHlMode] = useState("pdf");
  const [compMode, setCompMode] = useState("pdf");

  const [hlFile, setHlFile] = useState(null);
  const [hlLink, setHlLink] = useState("");
  
  const [compFile, setCompFile] = useState(null);
  const [compLink, setCompLink] = useState("");

  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);

  const extractTextFromPDF = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            let strings = content.items.map((item) => item.str);
            // Sanitize: remove null bytes and non-printable chars
            strings = strings.map(s => s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ""));
            fullText += strings.join(" ") + "\n";
          }
          // Final sanitization and cap to 40k chars per quote to avoid massive payloads
          const sanitized = fullText.replace(/\0/g, "").trim().slice(0, 40000);
          resolve(sanitized || "[PDF extracted but no readable text found — may be scanned image]");
        } catch (err) {
          reject(new Error("Failed to read PDF: " + err.message));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const actualCompetitor = competitor === "Other" ? (otherComp || "Other") : competitor;

    let hlText = "";
    if (hlMode === "pdf") {
      if (!hlFile) return setError("Please upload the HomeLane quote PDF.");
      try { hlText = await extractTextFromPDF(hlFile); } catch (err) { return setError("HL PDF Error: " + err.message); }
    } else {
      if (!hlLink) return setError("Please paste the HomeLane quote URL.");
      hlText = `[HomeLane Quote URL provided: ${hlLink}]\n\nNote: This is a web link. Please analyse based on the URL.`;
    }

    let compText = "";
    if (compMode === "pdf") {
      if (!compFile) return setError("Please upload the competitor quote PDF.");
      try { compText = await extractTextFromPDF(compFile); } catch (err) { return setError("Comp PDF Error: " + err.message); }
    } else {
      if (!compLink) return setError("Please paste the competitor quote URL.");
      compText = `[${actualCompetitor} Quote URL provided: ${compLink}]\n\nNote: This is a web link. Please analyse based on the URL.`;
    }

    setIsAnalysing(true);
    
    // Simulate steps for UX
    const interval = setInterval(() => setStep(s => s < 2 ? s + 1 : s), 3000);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hlText, compText, competitor: actualCompetitor, projectType, customerName, comments })
      });

      const data = await res.json();
      clearInterval(interval);
      if (!res.ok) throw new Error(data.error || "Failed to analyze quotes.");

      onComplete({
        ...data,
        meta: { customerName, competitor: actualCompetitor, projectType },
        date: new Date().toLocaleDateString("en-IN")
      });
    } catch (err) {
      clearInterval(interval);
      setError(err.message);
      setIsAnalysing(false);
      setStep(0);
    }
  };

  if (isAnalysing) {
    return (
      <div className="page-overlay active">
        <div className="analysing-card glass-card">
          <div className="analysing-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring r2"></div>
            <div className="spinner-ring r3"></div>
            <div className="spinner-logo">AI</div>
          </div>
          <div>
            <h2 className="analysing-title">Analysing Quotes...</h2>
            <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Please wait while our AI extracts and compares specifications.</p>
          </div>
          <div className="analysing-steps">
            <div className={`step-item ${step >= 0 ? "active" : ""} ${step > 0 ? "done" : ""}`}>
              <div className="step-dot"></div><span>Extracting text & items</span>
            </div>
            <div className={`step-item ${step >= 1 ? "active" : ""} ${step > 1 ? "done" : ""}`}>
              <div className="step-dot"></div><span>Comparing specifications</span>
            </div>
            <div className={`step-item ${step >= 2 ? "active" : ""}`}>
              <div className="step-dot"></div><span>Generating sales strategy</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page active">
      <nav className="navbar glass-nav">
        <div className="nav-left">
          <button className="btn btn-icon btn-ghost" onClick={onBack}>←</button>
          <span className="nav-brand">New Comparison</span>
        </div>
      </nav>
      <main className="main-content form-main">
        {error && <div className="alert alert-error" style={{marginBottom: '1rem'}}>{error}</div>}
        <form className="compare-form" onSubmit={handleSubmit}>
          
          <div className="form-section glass-card">
            <h2 className="card-section-title">Client Details</h2>
            <div className="form-group">
              <label className="form-label">Competitor Firm</label>
              <select className="form-input" value={competitor} onChange={e => setCompetitor(e.target.value)}>
                {COMPETITORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {competitor === "Other" && (
              <div className="form-group">
                <input type="text" className="form-input" placeholder="Type competitor name..." value={otherComp} onChange={e => setOtherComp(e.target.value)} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Project Type</label>
              <select className="form-input" value={projectType} onChange={e => setProjectType(e.target.value)}>
                <option value="1BHK">1BHK</option><option value="2BHK">2BHK</option>
                <option value="3BHK">3BHK</option><option value="4BHK+">4BHK+</option>
                <option value="Villa">Villa / Independent House</option><option value="Partial">Partial Renovation</option>
              </select>
            </div>
            <div className="form-group">
               <label className="form-label">Customer Name (Optional)</label>
               <input type="text" className="form-input" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>
          </div>

          <div className="form-section glass-card" style={{borderColor: 'var(--border-gold)'}}>
            <div className="section-badge hl-badge">HomeLane</div>
            <div className="toggle-group">
              <button type="button" className={`toggle-btn ${hlMode==='pdf'?'active':''}`} onClick={() => setHlMode('pdf')}>Upload PDF</button>
              <button type="button" className={`toggle-btn ${hlMode==='link'?'active':''}`} onClick={() => setHlMode('link')}>Web Link</button>
            </div>
            {hlMode === 'pdf' ? (
              <div className="upload-area">
                <input type="file" className="file-input" accept="application/pdf" onChange={e => setHlFile(e.target.files[0])} />
                <div className="upload-label">
                  <div className="upload-icon">📄</div>
                  <div className="upload-text">{hlFile ? `✅ ${hlFile.name}` : "Drop PDF here or Browse Files"}</div>
                </div>
              </div>
            ) : (
              <input type="url" className="form-input" placeholder="https://" value={hlLink} onChange={e => setHlLink(e.target.value)} />
            )}
          </div>

          <div className="form-section glass-card" style={{borderColor: 'rgba(59,130,246,0.3)'}}>
            <div className="section-badge comp-badge">Competitor</div>
            <div className="toggle-group">
              <button type="button" className={`toggle-btn ${compMode==='pdf'?'active':''}`} onClick={() => setCompMode('pdf')}>Upload PDF</button>
              <button type="button" className={`toggle-btn ${compMode==='link'?'active':''}`} onClick={() => setCompMode('link')}>Web Link</button>
            </div>
            {compMode === 'pdf' ? (
              <div className="upload-area">
                <input type="file" className="file-input" accept="application/pdf" onChange={e => setCompFile(e.target.files[0])} />
                <div className="upload-label">
                  <div className="upload-icon">📄</div>
                  <div className="upload-text">{compFile ? `✅ ${compFile.name}` : "Drop PDF here or Browse Files"}</div>
                </div>
              </div>
            ) : (
             <input type="url" className="form-input" placeholder="https://" value={compLink} onChange={e => setCompLink(e.target.value)} />
            )}
          </div>

          <div className="form-section glass-card">
            <h2 className="card-section-title">Sales Notes</h2>
            <textarea className="form-input" rows="3" placeholder="E.g., Customer is leaning towards LIVSPACE because they promised 30-day delivery..." value={comments} onChange={e => setComments(e.target.value)}></textarea>
          </div>

          <button type="submit" className="btn btn-primary btn-submit">Analyze & Compare Quotes →</button>
        </form>
      </main>
    </div>
  );
}

function ResultsView({ result, onBack, onNew }) {
  const meta = result.meta;
  const pct = typeof result.priceDiffPercent === "number" ? result.priceDiffPercent : 0;
  const absPct = Math.abs(pct).toFixed(1) + "%";
  const [toast, setToast] = useState("");

  const getDiffAmount = (h, l) => {
    const parse = s => s ? parseInt(s.replace(/[^\d]/g, ""), 10) || 0 : 0;
    const diff = parse(h) - parse(l);
    return diff > 0 ? diff.toLocaleString("en-IN") : "—";
  };

  const diffText = pct > 0 ? `HL ₹${getDiffAmount(result.hlPrice, result.compPrice)} more`
                 : pct < 0 ? `HL ₹${getDiffAmount(result.compPrice, result.hlPrice)} less`
                 : "Same price";

  const handleShare = () => {
    try {
      const encoded = btoa(encodeURIComponent(JSON.stringify(result)));
      const url = `${window.location.origin}${window.location.pathname}?result=${encoded}`;
      navigator.clipboard.writeText(url);
      setToast("✅ Link copied to clipboard!");
      setTimeout(() => setToast(""), 3000);
    } catch {
      setToast("❌ Failed to copy link.");
      setTimeout(() => setToast(""), 3000);
    }
  };

  return (
    <div className="page active">
      <nav className="navbar glass-nav no-print">
        <div className="nav-left">
           <button className="btn btn-icon btn-ghost" onClick={onBack}>←</button>
           <span className="nav-brand">Back to Dashboard</span>
        </div>
        <div className="nav-right">
          <button className="btn btn-secondary" onClick={handleShare}>🔗 Share</button>
          <button className="btn btn-secondary" onClick={() => window.print()}>⬇️ Download PDF</button>
          <button className="btn btn-primary no-print" onClick={onNew}>New Comparison</button>
        </div>
      </nav>
      {toast && (
        <div className="share-toast">{toast}</div>
      )}

      <main className="main-content results-main">
        <div className={`verdict-banner glass-card ${result.verdict === 'HL_HIGHER' ? 'hl-higher' : result.verdict === 'HL_LOWER' ? 'hl-lower' : 'hl-equal'}`}>
          <div>
            <div className="verdict-tag">
              {result.verdict === 'HL_HIGHER' ? '⚠️ HomeLane Higher' : result.verdict === 'HL_LOWER' ? '✅ HomeLane Lower' : '🟡 Price Match'}
            </div>
            <h1 className="verdict-title">{result.verdictTitle}</h1>
            <p className="verdict-sub">{result.verdictSub}</p>
          </div>
          <div className={`price-diff-circle ${result.verdict === 'HL_HIGHER' ? 'higher' : result.verdict === 'HL_LOWER' ? 'lower' : ''}`}>
             <span className="pdc-label">HL</span>
             <span className="pdc-value">{(pct > 0 ? "+" : pct < 0 ? "-" : "") + absPct}</span>
             <span className="pdc-unit">vs {meta.competitor}</span>
          </div>
        </div>

        <div className="summary-row">
          <div className="summary-card glass-card">
            <div className="sc-label">HomeLane Price</div>
            <div className="sc-value">{result.hlPrice}</div>
          </div>
          <div className="summary-card glass-card">
            <div className="sc-label">{meta.competitor} Price</div>
            <div className="sc-value">{result.compPrice}</div>
          </div>
          <div className="summary-card glass-card">
             <div className="sc-label">Difference</div>
             <div className="sc-value">{diffText}</div>
          </div>
        </div>

        {result.hlBreakdown && result.compBreakdown && (
          <div className="breakdown-row">
            <div className="breakdown-card glass-card">
              <div className="breakdown-header">
                <div className="logo-mark sm">HL</div>
                <span>HomeLane Breakdown</span>
              </div>
              <div className="breakdown-list">
                <div className="breakdown-item">
                  <span className="bi-label">Base Quote</span>
                  <span className="bi-value">{result.hlBreakdown.baseQuote}</span>
                </div>
                <div className="breakdown-item">
                  <span className="bi-label">Design & Mgmt Fee</span>
                  <span className="bi-value">{result.hlBreakdown.designFee}</span>
                </div>
                <div className="breakdown-item">
                  <span className="bi-label">Discount</span>
                  <span className="bi-value" style={{color: 'var(--green)'}}>{result.hlBreakdown.discount}</span>
                </div>
                <div className="breakdown-item">
                  <span className="bi-label">Tax (GST)</span>
                  <span className="bi-value">{result.hlBreakdown.tax}</span>
                </div>
                <div className="breakdown-item">
                  <span className="bi-label">Quote Validity</span>
                  <span className="bi-value">{result.hlBreakdown.validity}</span>
                </div>
                <div className="breakdown-item">
                  <span className="bi-label">Scope</span>
                  <span className="bi-value">{result.hlBreakdown.scope}</span>
                </div>
                 <div className="breakdown-item">
                  <span className="bi-label">Kitchen</span>
                  <span className="bi-value">{result.hlBreakdown.kitchen}</span>
                </div>
              </div>
            </div>

            <div className="breakdown-card glass-card">
              <div className="breakdown-header">
                <div className="stat-icon" style={{fontSize: '1.2rem'}}>🏢</div>
                <span>{meta.competitor} Breakdown</span>
              </div>
              <div className="breakdown-list">
                <div className="breakdown-item">
                  <span className="bi-label">Base Quote</span>
                  <span className="bi-value">{result.compBreakdown.baseQuote}</span>
                </div>
                <div className="breakdown-item">
                  <span className="bi-label">Design & Mgmt Fee</span>
                  <span className="bi-value">{result.compBreakdown.designFee}</span>
                </div>
                <div className="breakdown-item">
                  <span className="bi-label">Discount</span>
                  <span className="bi-value" style={{color: 'var(--green)'}}>{result.compBreakdown.discount}</span>
                </div>
                <div className="breakdown-item">
                  <span className="bi-label">Tax (GST)</span>
                  <span className="bi-value">{result.compBreakdown.tax}</span>
                </div>
                <div className="breakdown-item">
                  <span className="bi-label">Quote Validity</span>
                  <span className="bi-value">{result.compBreakdown.validity}</span>
                </div>
                <div className="breakdown-item">
                  <span className="bi-label">Scope</span>
                  <span className="bi-value">{result.compBreakdown.scope}</span>
                </div>
                <div className="breakdown-item">
                  <span className="bi-label">Kitchen</span>
                  <span className="bi-value">{result.compBreakdown.kitchen}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {result.rooms && result.rooms.length > 0 && (
          <div className="results-section glass-card">
            <h3 className="section-title">🏠 Room-by-Room Comparison</h3>
            <div className="room-table-wrap">
              <table className="room-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>{meta.competitor}</th>
                    <th>HomeLane</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rooms.map((room, i) => (
                    <tr key={i}>
                      <td className="room-name">{room.name}</td>
                      <td className="room-price room-price-comp">{room.compValue}</td>
                      <td className="room-price room-price-hl">{room.hlValue}</td>
                      <td className="room-notes">{room.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="results-section glass-card">
          <h3 className="section-title">📊 Factor-by-Factor Breakdown</h3>
          <div className="factor-table-wrap">
            <table className="factor-table">
              <thead>
                <tr>
                  <th>Factor</th>
                  <th>HomeLane</th>
                  <th>Competitor</th>
                  <th>Advantage</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {(result.factors || []).map((f, i) => (
                  <tr key={i}>
                    <td className="factor-name">{f.name}</td>
                    <td className="factor-hl">{f.hlValue}</td>
                    <td className="factor-comp">{f.compValue}</td>
                    <td>
                      {f.advantage === 'HL' && <span className="advantage-hl">✅ HomeLane</span>}
                      {f.advantage === 'COMP' && <span className="advantage-comp">⚠️ Competitor</span>}
                      {f.advantage === 'EQUAL' && <span className="advantage-equal">🟡 Equal</span>}
                    </td>
                    <td style={{color: 'var(--text-secondary)', fontSize: '0.82rem'}}>{f.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {result.actionPlan && result.actionPlan.length > 0 && (
          <div className="results-section glass-card">
            <h3 className="section-title">🎯 Actionable Sales Strategy</h3>
            <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              {result.actionPlan.map((point, i) => (
                <li key={i} style={{ marginBottom: '0.75rem' }}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="results-meta">
          <span>Customer: <strong>{meta.customerName || "—"}</strong></span>
          <span>Competitor: <strong>{meta.competitor}</strong></span>
          <span>Project: <strong>{meta.projectType}</strong></span>
          <span>Analysed: <strong>{result.date}</strong></span>
        </div>
      </main>
    </div>
  );
}

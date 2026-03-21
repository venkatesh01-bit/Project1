"use client";

import { useState, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

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
    const loadShared = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const encoded = params.get("result");
        if (encoded) {
          const safeEncoded = encoded.replace(/ /g, '+');
          const binary = atob(safeEncoded);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          
          const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
          const response = new Response(stream);
          const text = await response.text();
          const decoded = JSON.parse(decodeURIComponent(text));
          
          setCurrentResult(decoded);
          setActiveTab("results");
        }
      } catch (err) {
        console.error("Failed to load shared result:", err);
      }
    };
    loadShared();
  }, []);

  const saveHistory = (newHistory) => {
    setHistory(newHistory);
    localStorage.setItem("hl_comparisons_next", JSON.stringify(newHistory.slice(-50)));
  };

  const renderDashboard = () => (
    <div className="page active light-theme" id="page-dashboard">
      <div className="engine-backdrop light">
        <img src="file:///Users/venkateshg/.gemini/antigravity/brain/c53784ce-fa8e-4921-a407-ea42942b484a/light_luxury_interior_v3_1774009725168.png" alt="" />
        <div className="backdrop-overlay light"></div>
      </div>

      <nav className="navbar glass-nav light">
        <div className="nav-left">
          <div className="logo-mark sm hungry">HL</div>
          <span className="nav-brand dark-text">Sales Intelligence</span>
        </div>
      </nav>

      <main className="main-content">
        <div className="hero-section light">
          <div className="hero-content">
            <div className="hero-tag hungry">Compare. Win. Deliver.</div>
            <h1 className="hero-title flashy-text hungry">Kill The Bill</h1>
            <p className="hero-sub dark">Empowering HomeLane Champs to crush the competition with data-driven strategies.</p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-xl hungry-btn" onClick={() => setActiveTab("compare")}>
                + New Comparison
              </button>
            </div>
          </div>
          <div className="hero-graphic floating">
            <img src="/images/kill-the-bill.png" alt="Kill the Bill" />
          </div>
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
              [...history].reverse().map((item, i) => {
                const compNames = item.competitors?.map(c => c.name).join(" vs ") || item.meta.competitor || "Unnamed";
                const customerName = item.meta.customerName || "Customer";
                const projectType = item.meta.projectType || "Project";
                const displayName = `${customerName}'s ${projectType} - Comparison with ${compNames}`;
                const mainVerdict = item.competitors?.[0]?.verdict || item.verdict;
                return (
                  <div key={i} className="history-item glass-card" onClick={() => {
                    setCurrentResult(item);
                    setActiveTab("results");
                  }}>
                    <div className="hi-left">
                      <div className="hi-title">{displayName}</div>
                      <div className="hi-meta">{item.date}</div>
                    </div>
                    <div className="hi-right">
                      <span className={`verdict-pill ${mainVerdict === 'HL_HIGHER' ? 'higher' : mainVerdict === 'HL_LOWER' ? 'lower' : 'equal'}`}>
                        {mainVerdict === 'HL_HIGHER' ? 'HL Higher' : mainVerdict === 'HL_LOWER' ? 'HL Lower' : 'Price Match'}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </div>
                );
              })
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
  const [customerName, setCustomerName] = useState("");
  const [projectType, setProjectType] = useState("3BHK");
  const [comments, setComments] = useState("");

  const [hlFile, setHlFile] = useState(null);
  const [hlUrl, setHlUrl] = useState("");
  const [hlSource, setHlSource] = useState("pdf"); // 'pdf' or 'url'

  const [comp1File, setComp1File] = useState(null);
  const [comp1Url, setComp1Url] = useState("");
  const [comp1Source, setComp1Source] = useState("pdf");

  const [comp2File, setComp2File] = useState(null);
  const [comp2Url, setComp2Url] = useState("");
  const [comp2Source, setComp2Source] = useState("pdf");

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
            strings = strings.map(s => s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ""));
            fullText += strings.join(" ") + "\n";
          }
          const sanitized = fullText.replace(/\0/g, "").trim().slice(0, 40000);
          resolve(sanitized || "[PDF extracted but no readable text found]");
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

    // Validation
    if (hlSource === 'pdf' && !hlFile) return setError("Please upload the HomeLane quote PDF.");
    if (hlSource === 'url' && !hlUrl) return setError("Please provide the HomeLane quote Weblink.");
    if (comp1Source === 'pdf' && !comp1File) return setError("Please upload the 1st competitor quote PDF.");
    if (comp1Source === 'url' && !comp1Url) return setError("Please provide the 1st competitor quote Weblink.");

    setIsAnalysing(true);
    const interval = setInterval(() => setStep(s => s < 2 ? s + 1 : s), 3000);

    try {
      const hlData = hlSource === 'pdf' ? await extractTextFromPDF(hlFile) : hlUrl;
      const comp1Data = comp1Source === 'pdf' ? await extractTextFromPDF(comp1File) : comp1Url;
      const comp2Data = comp2Source === 'pdf' ? (comp2File ? await extractTextFromPDF(comp2File) : null) : (comp2Url || null);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          hlText: hlData, 
          comp1Text: comp1Data, 
          comp2Text: comp2Data, 
          hlSource, comp1Source, comp2Source,
          projectType, comments, customerName 
        })
      });

      const data = await res.json();
      clearInterval(interval);
      if (!res.ok) throw new Error(data.error || "Failed to analyze quotes.");

      onComplete({
        ...data,
        meta: { projectType, customerName },
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

  const renderQuoteSection = (id, label, source, setSource, file, setFile, url, setUrl, isOptional = false) => {
    const isHL = id === 'hl';
    const icon = isHL ? '🏆' : '⚔️';
    return (
      <div className={`compare-fieldset ${isHL ? 'hl-prime-fieldset' : ''}`}>
        <div className="fieldset-header rich-header">
          <div className="header-title-group">
            <span className="header-icon">{icon}</span>
            <h3 className="fieldset-title">{label} {isOptional && <span className="optional-tag">Optional</span>}</h3>
          </div>
          <div className="segmented-control">
            <button type="button" className={`seg-btn ${source === 'pdf' ? 'active' : ''}`} onClick={() => setSource('pdf')}>Upload PDF</button>
            <button type="button" className={`seg-btn ${source === 'url' ? 'active' : ''}`} onClick={() => setSource('url')}>Weblink</button>
          </div>
        </div>
        
        <div className="fieldset-body">
          {source === 'pdf' ? (
            <div className="uniform-upload-zone">
              <input type="file" className="file-input-hidden" accept="application/pdf" onChange={e => setFile(e.target.files[0])} id={`file-${id}`} />
              <label htmlFor={`file-${id}`} className="uniform-upload-label">
                <span className="upl-icon">📄</span>
                <span className="upl-text">{file ? file.name : "Click to select PDF"}</span>
              </label>
            </div>
          ) : (
            <div className="uniform-input-group">
              <span className="inp-prefix">🔗</span>
              <input 
                type="url" 
                className="uniform-input with-prefix" 
                placeholder="https://..." 
                value={url} 
                onChange={e => setUrl(e.target.value)} 
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="split-screen-layout">
      {/* Left Visual Panel */}
      <div className="split-visual-panel">
        <div className="visual-overlay"></div>
        <img src="/images/split_screen.png" alt="Luxury Interior" className="visual-bg" />
        <div className="visual-content">
          <div className="visual-branding">
             <div className="logo-mark sm hungry">HL</div>
             <span className="brand-name">Intelligence Engine <span className="version-tag hungry">V3.0</span></span>
          </div>
          <h1 className="visual-hero-title">Fueling The Win<span className="hungry-text">.</span></h1>
          <p className="visual-hero-sub">Upload quotes to extract actionable insights and close the deal.</p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="split-form-panel">
        <div className="form-container">
          <div className="desktop-back-nav">
            <button className="btn btn-icon btn-ghost dark-icon" onClick={onBack}>← Back to Dashboard</button>
          </div>
          
          <div className="form-header-mobile">
            <button className="btn btn-icon btn-ghost" onClick={onBack}>← Back</button>
            <h2>Fueling The Win</h2>
          </div>

          {error && <div className="alert alert-error hungry-alert anim-shake">{error}</div>}

          <form className="saas-form" onSubmit={handleSubmit}>
            <div className="compare-fieldset">
              <div className="fieldset-header rich-header">
                <div className="header-title-group">
                  <span className="header-icon">📁</span>
                  <h3 className="fieldset-title">Project Context</h3>
                </div>
              </div>
              <div className="fieldset-body grid-2">
                <div className="input-wrapper">
                  <label className="saas-label">Customer Name</label>
                  <input className="uniform-input" placeholder="Enter name" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
                </div>
                <div className="input-wrapper">
                  <label className="saas-label">Space Type</label>
                  <select className="uniform-input box-select" value={projectType} onChange={e => setProjectType(e.target.value)}>
                    <option value="1BHK">1BHK Apartment</option><option value="2BHK">2BHK Apartment</option>
                    <option value="3BHK">3BHK Apartment</option><option value="4BHK+">4BHK+ / Duplex</option>
                    <option value="Villa">Luxury Villa</option><option value="Partial">Partial Integration</option>
                  </select>
                </div>
              </div>
            </div>

            {renderQuoteSection('hl', 'HomeLane Quote', hlSource, setHlSource, hlFile, setHlFile, hlUrl, setHlUrl)}
            {renderQuoteSection('comp1', 'Competitor Quote I', comp1Source, setComp1Source, comp1File, setComp1File, comp1Url, setComp1Url)}
            {renderQuoteSection('comp2', 'Competitor Quote II', comp2Source, setComp2Source, comp2File, setComp2File, comp2Url, setComp2Url, true)}

            <div className="compare-fieldset borderless">
              <div className="fieldset-header rich-header">
                <div className="header-title-group">
                  <span className="header-icon">📝</span>
                  <h3 className="fieldset-title">Sales Notes</h3>
                </div>
              </div>
              <div className="fieldset-body">
                <textarea 
                  className="uniform-input saas-textarea" 
                  placeholder="Any other additional info to be added to generate accurate analysis" 
                  value={comments} 
                  onChange={e => setComments(e.target.value)}
                ></textarea>
              </div>
            </div>

            <button type="submit" className="btn btn-primary saas-submit-btn hungry">
               RUN INTELLIGENCE ANALYSIS →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ResultsView({ result, onBack, onNew }) {
  const [toast, setToast] = useState("");
  const comps = result.competitors || [];
  const comp1 = comps[0] || null;
  const comp2 = comps[1] || null;

  const handleShare = async () => {
    try {
      setToast("⏳ Generating short link...");
      const json = encodeURIComponent(JSON.stringify(result));
      const stream = new Blob([json]).stream().pipeThrough(new CompressionStream("gzip"));
      const response = new Response(stream);
      const buffer = await response.arrayBuffer();
      const binary = String.fromCharCode(...new Uint8Array(buffer));
      const encoded = encodeURIComponent(btoa(binary));
      const longUrl = `${window.location.origin}${window.location.pathname}?result=${encoded}`;
      const shortenResp = await fetch("/api/shorten", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: longUrl }) });
      const { shortUrl, error } = await shortenResp.json();
      if (error) throw new Error(error);
      await navigator.clipboard.writeText(shortUrl);
      setToast("✅ Short link copied to clipboard!");
      setTimeout(() => setToast(""), 3000);
    } catch (err) {
      setToast("❌ Failed to create short link.");
      setTimeout(() => setToast(""), 3000);
    }
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    setToast("⏳ Generating Premium Report...");
    
    // Allow React/DOM to settle before capture
    await new Promise(r => setTimeout(r, 500));
    
    const element = document.getElementById('pdf-report-container');
    if (!element) {
      setIsGeneratingPDF(false);
      return;
    }

    element.classList.add('export-mode');

    try {
      const canvas = await html2canvas(element, {
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        windowWidth: 1200 // Force standard width for PDF
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`Intelligence_Report_${new Date().getTime()}.pdf`);
      setToast("✅ PDF Downloaded!");
    } catch (error) {
      console.error('Error generating PDF:', error);
      setToast("❌ Failed to generate PDF.");
    } finally {
      element.classList.remove('export-mode');
      setTimeout(() => setToast(""), 3000);
      setIsGeneratingPDF(false);
    }
  };



  return (
    <div className="page active light-theme">
      <div className="engine-backdrop light">
        <img src="file:///Users/venkateshg/.gemini/antigravity/brain/c53784ce-fa8e-4921-a407-ea42942b484a/light_luxury_interior_v3_1774009725168.png" alt="" />
        <div className="backdrop-overlay light"></div>
      </div>

      <nav className="navbar glass-nav luxury-nav light no-print">
        <div className="nav-left">
           <button className="btn btn-icon btn-ghost dark-icon" onClick={onBack}>←</button>
           <span className="nav-brand-luxury dark-text">Intelligence Report</span>
        </div>
        <div className="nav-right">
          <button className="btn btn-secondary hungry-outline" onClick={handleShare}>🔗 Share</button>
          <button className="btn btn-primary hungry-btn" onClick={generatePDF} disabled={isGeneratingPDF}>{isGeneratingPDF ? '⏳ Processing...' : '⬇️ Download Premium PDF'}</button>
          <button className="btn btn-secondary hungry-outline no-print" onClick={onNew}>New Comparison</button>
        </div>
      </nav>
      {toast && <div className="share-toast">{toast}</div>}

      <main className="main-content results-main" id="pdf-report-container">
        
        {/* PDF Header (Only visible in PDF) */}
        <div className="pdf-only-header">
           <h1 style={{margin:0, color:'var(--primary)'}}>HomeLane Intelligence Report</h1>
           <p style={{margin:0, color:'var(--text-secondary)'}}>Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {result.validation && !result.validation.isValidHomeLane && (
          <div className="validation-error-card glass-card">
            <div className="ve-icon">❌</div>
            <h2 className="ve-title">Invalid HomeLane Quote</h2>
            <p className="ve-msg">{result.validation.errorMessage || "The first quote uploaded does not appear to be a valid HomeLane quote. Please upload the correct PDF for an accurate comparison."}</p>
            <button className="btn btn-primary" style={{marginTop: '1rem'}} onClick={onNew}>Upload Correct Quote</button>
          </div>
        )}

        {result.validation && result.validation.isValidHomeLane && !result.validation.isConsistent && (
          <div className="validation-warning-banner glass-card">
            <span className="vw-icon">⚠️</span>
            <div className="vw-content">
              <strong>Consistency Warning:</strong> {result.validation.consistencyWarning || "The uploaded quotes seem to be for completely different specifications or projects. Please verify if they belong to the same customer."}
            </div>
          </div>
        )}

        {result.validation?.isValidHomeLane && comps.map((c, idx) => (
          <div key={idx} className={`verdict-banner glass-card ${c.verdict === 'HL_HIGHER' ? 'hl-higher' : 'hl-lower'}`} style={{marginBottom: '1rem'}}>
            <div>
              <div className="verdict-tag">{c.verdict === 'HL_HIGHER' ? '⚠️ HomeLane Higher' : '✅ HomeLane Lower'} vs {c.name}</div>
              <h1 className="verdict-title">{c.verdictTitle}</h1>
              <p className="verdict-sub">{c.verdictSub}</p>
            </div>
            <div className={`price-diff-circle ${c.verdict === 'HL_HIGHER' ? 'higher' : 'lower'}`}>
               <span className="pdc-label">HL</span>
               <span className="pdc-value">{(c.priceDiffPercent && Number(c.priceDiffPercent) > 0 ? "+" : "") + (c.priceDiffPercent ? Number(c.priceDiffPercent).toFixed(1) : "0.0")}%</span>
               <span className="pdc-unit">vs {c.name}</span>
            </div>
          </div>
        ))}

        {result.validation?.isValidHomeLane && (
          <>
            {comps.map((c, idx) => c.monetarySummary && (
              <div key={idx} className="monetary-summary glass-card" style={{ marginBottom: '1.5rem' }}>
                <div className="ms-header">
                  <span className="ms-icon">📊</span>
                  <h2 className="ms-title">Price Match Summary vs {c.name}</h2>
                </div>
                <div className="ms-grid">
                  <div className="ms-item">
                    <span className="ms-label">Total Gap</span>
                    <span className="ms-value">{c.monetarySummary.totalGap}</span>
                  </div>
                  <div className="ms-item highlight">
                    <span className="ms-label">Technical Gap (Specs/Quality)</span>
                    <span className="ms-value text-gold">{c.monetarySummary.technicalGap}</span>
                  </div>
                  <div className="ms-item">
                    <span className="ms-label">Potential Reduced HL Price</span>
                    <span className="ms-value text-green">{c.monetarySummary.potentialHLPrice}</span>
                  </div>
                </div>
                <p className="ms-explanation"><strong>Strategy:</strong> {c.monetarySummary.explanation}</p>
              </div>
            ))}


            <div className="summary-row" style={{marginTop: '2rem'}}>
              <div className="summary-card glass-card">
                <div className="sc-label">HomeLane Price</div>
                <div className="sc-value">{result.hlPrice}</div>
              </div>
              {comps.map((c, idx) => (
                <div key={idx} className="summary-card glass-card">
                  <div className="sc-label">{c.name} Price</div>
                  <div className="sc-value">{c.price}</div>
                </div>
              ))}
            </div>

            <div className="breakdown-grid" style={{display: 'grid', gridTemplateColumns: `repeat(${comps.length + 1}, 1fr)`, gap: '1.5rem', marginBottom: '2rem'}}>
               <BreakdownCard title="HomeLane" data={result.hlBreakdown} isHL={true} rooms={result.rooms} providerKey="hlValue" />
               {comps.map((c, idx) => (
                 <BreakdownCard key={idx} title={c.name} data={c.breakdown} rooms={result.rooms} providerKey={idx === 0 ? 'comp1Value' : 'comp2Value'} />
               ))}
            </div>

            {result.additionalScope && result.additionalScope.length > 0 && (
              <div className="results-section glass-card" style={{borderColor: 'var(--primary)'}}>
                <h3 className="section-title">✨ Additional Scope by HomeLane</h3>
                <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem'}}>Items explicitly included in the HomeLane quote that competitors missed or charged extra for.</p>
                <div className="additional-scope-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem'}}>
                  {result.additionalScope.map((item, i) => (
                    <div key={i} className="scope-item" style={{background: 'var(--surface)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                        <strong>{item.item}</strong>
                        <span className="scope-cost" style={{color: 'var(--primary)', fontWeight: 'bold'}}>{item.costImpact}</span>
                      </div>
                      <p className="scope-note" style={{fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0}}>{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.kitchenAccessoriesSummary && (
              <div className="results-section glass-card alert-bg" style={{background: 'rgba(255,179,0,0.05)', border: '1px solid rgba(255,179,0,0.3)'}}>
                <h3 className="section-title">🍳 Kitchen Accessories Highlight</h3>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1.05rem'}}>
                  <strong>HomeLane: <span style={{color: 'var(--green)'}}>{result.kitchenAccessoriesSummary.hlCount}</span></strong>
                  <span>{result.kitchenAccessoriesSummary.compNamesAndCounts}</span>
                </div>
                <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0}}>{result.kitchenAccessoriesSummary.costImpactNote}</p>
              </div>
            )}

            {comps.map((c, idx) => (
              <div key={`deep-dive-${idx}`}>
                {c.decorpotSqftAnalysis && (
                  <div className="results-section glass-card" style={{background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(249,250,251,1) 100%)', border: '1px solid #d1d5db'}}>
                    <h3 className="section-title">📐 Decorpot SqFt Analysis</h3>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px dashed #ccc'}}>
                      <div><span style={{color:'var(--text-secondary)', fontSize:'0.85rem', display:'block'}}>HomeLane Approx Area</span><strong style={{fontSize:'1.1rem'}}>{c.decorpotSqftAnalysis.hlApproxSqft}</strong></div>
                      <div><span style={{color:'var(--text-secondary)', fontSize:'0.85rem', display:'block'}}>Decorpot Quoted Area</span><strong style={{fontSize:'1.1rem'}}>{c.decorpotSqftAnalysis.dpSqft}</strong></div>
                    </div>
                    <p style={{marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)'}}>{c.decorpotSqftAnalysis.note}</p>
                  </div>
                )}

                {c.moduleComparison && c.moduleComparison.length > 0 && (
                  <div className="results-section glass-card">
                    <h3 className="section-title">📏 Module Dimensions vs {c.name}</h3>
                    <div className="factor-table-wrap">
                      <table className="factor-table">
                        <thead>
                          <tr>
                            <th>Module Component</th>
                            <th>HomeLane Specs</th>
                            <th>{c.name} Specs</th>
                            <th>Sales Impact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.moduleComparison.map((m, i) => (
                            <tr key={i}>
                              <td style={{fontWeight: '500'}}>{m.moduleName}</td>
                              <td style={{color: 'var(--text-primary)', fontWeight: '600'}}>{m.hlDimensions}</td>
                              <td style={{color: 'var(--text-secondary)'}}>{m.compDimensions}</td>
                              <td style={{fontSize: '0.85rem', color: 'var(--primary)'}}>{m.dimensionDifference}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {c.missingElementsValuation && c.missingElementsValuation.length > 0 && (
                  <div className="results-section glass-card" style={{borderLeft: '4px solid #ef4444'}}>
                    <h3 className="section-title" style={{color: '#ef4444'}}>⚠️ Hidden Costs: Missing Elements in {c.name}</h3>
                    <ul style={{paddingLeft: '1.2rem', margin: 0, color: 'var(--text-secondary)'}}>
                      {c.missingElementsValuation.map((m, i) => (
                        <li key={i} style={{marginBottom: '0.5rem', lineHeight: '1.5'}}>
                          <strong style={{color: 'var(--text-primary)'}}>{m.missingItem}</strong> <span style={{color: '#ef4444', fontWeight: 'bold'}}>(Est. Value: {m.estimatedValue})</span>
                          <div style={{fontSize: '0.85rem', marginTop: '0.2rem'}}>{m.description}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {result.rooms && result.rooms.length > 0 && (
              <div className="results-section glass-card">
                <h3 className="section-title">🏠 Room-by-Room Comparison</h3>
                <div className="room-table-wrap">
                  <table className="room-table">
                    <thead>
                      <tr>
                        <th>Room</th>
                        <th>HomeLane</th>
                        <th>{comp1?.name || 'Comp 1'}</th>
                        {comp2 && <th>{comp2.name}</th>}
                        <th>Comparison Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.rooms.map((room, i) => (
                        <tr key={i}>
                          <td className="room-name">{room.name}</td>
                          <td className="room-price room-price-hl">{room.hlValue}</td>
                          <td className="room-price room-price-comp">{room.comp1Value}</td>
                          {comp2 && <td className="room-price room-price-comp">{room.comp2Value}</td>}
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
                      <th>{comp1?.name || 'Comp 1'}</th>
                      {comp2 && <th>{comp2.name}</th>}
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(result.factors || []).map((f, i) => (
                      <tr key={i}>
                        <td className="factor-name">{f.name}</td>
                        <td className="factor-hl">{f.hlValue}</td>
                        <td className="factor-comp">{f.comp1Value}</td>
                        {comp2 && <td className="factor-comp">{f.comp2Value}</td>}
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
          </>
        )}
      </main>
    </div>
  );
}

function BreakdownCard({ title, data, isHL, rooms, providerKey }) {
  if (!data) return null;

  const parseCurrency = (val) => {
    if (!val) return 0;
    return Number(String(val).replace(/[^0-9.-]+/g,""));
  };

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  const pieData = (rooms || []).map((room, i) => {
    const val = parseCurrency(room[providerKey]);
    return {
      name: room.name,
      value: val,
      fill: COLORS[i % COLORS.length]
    };
  }).filter(d => d.value > 0);

  return (
    <div className="breakdown-card glass-card">
      <div className="breakdown-header">
        {isHL ? <div className="logo-mark sm">HL</div> : <div className="stat-icon" style={{fontSize: '1.2rem'}}>🏢</div>}
        <span>{title} Breakdown</span>
      </div>
      <div className="breakdown-list">
        {Object.entries({
          "Base Quote": data.baseQuote,
          "Design & Mgmt Fee": data.designFee,
          "Discount": data.discount,
          "Tax (GST)": data.tax,
          "Quote Validity": data.validity,
          "Scope": data.scope,
          "Kitchen": data.kitchen
        }).map(([label, val]) => (
          <div key={label} className="breakdown-item">
            <span className="bi-label">{label}</span>
            <span className="bi-value" style={label === 'Discount' ? {color: 'var(--green)'} : {}}>{val || "—"}</span>
          </div>
        ))}
      </div>
      {pieData.length > 0 && (
        <div style={{height: 160, width: '100%', marginTop: '1rem'}} className="no-print-hide-svg">
          <ResponsiveContainer>
            <PieChart>
               <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} stroke="none" label={({percent}) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                 {pieData.map((entry, index) => <Cell key={`cell-card-${index}`} fill={entry.fill} />)}
               </Pie>
               <Tooltip formatter={(value) => `₹ ${value.toLocaleString()}`} />
               <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

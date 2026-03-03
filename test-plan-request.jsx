import { useState, useRef } from "react";

const TEST_TYPES = [
  "Software / Firmware Validation",
  "Hardware Qualification",
  "Control System Validation",
  "Sensor Calibration / Validation",
  "Integration Test",
  "Regression / Re-test",
  "Environmental Qualification",
  "Other",
];

const RISK_LEVELS = [
  { value: "low", label: "Low", color: "#2d936c", desc: "No safety-critical systems affected" },
  { value: "medium", label: "Medium", color: "#e8973e", desc: "Involves flight-critical systems with mitigations" },
  { value: "high", label: "High", color: "#d1495b", desc: "Safety-of-flight risk, requires additional review" },
];

const PRIORITY = [
  { value: "standard", label: "Standard", desc: "4–6 week lead time" },
  { value: "elevated", label: "Elevated", desc: "2–3 week lead time" },
  { value: "urgent", label: "Urgent", desc: "< 2 weeks — requires manager approval" },
];

function TextInput({ label, placeholder, value, onChange, required, multiline, rows = 3, hint }) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <div style={{ marginBottom: 22 }}>
      <label style={S.label}>
        {label}
        {required && <span style={{ color: "#d1495b", marginLeft: 3 }}>*</span>}
      </label>
      {hint && <p style={S.hint}>{hint}</p>}
      <Tag
        style={{ ...S.input, ...(multiline ? { minHeight: rows * 28, resize: "vertical" } : {}) }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={multiline ? rows : undefined}
      />
    </div>
  );
}

function SelectInput({ label, options, value, onChange, required, hint }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label style={S.label}>
        {label}
        {required && <span style={{ color: "#d1495b", marginLeft: 3 }}>*</span>}
      </label>
      {hint && <p style={S.hint}>{hint}</p>}
      <select style={{ ...S.input, cursor: "pointer" }} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
            {typeof o === "string" ? o : o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CardSelect({ label, options, value, onChange, required, hint }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label style={S.label}>
        {label}
        {required && <span style={{ color: "#d1495b", marginLeft: 3 }}>*</span>}
      </label>
      {hint && <p style={S.hint}>{hint}</p>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {options.map((o) => {
          const sel = value === o.value;
          return (
            <button key={o.value} onClick={() => onChange(o.value)} style={{
              flex: "1 1 140px", padding: "14px 16px",
              border: sel ? "2px solid #1a2b4a" : "2px solid #d0d4dc",
              borderRadius: 10, background: sel ? "#f0f3f9" : "#fff",
              cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            }}>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 14, color: o.color || "#1a2b4a" }}>{o.label}</div>
              {o.desc && <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#6b7280", marginTop: 4 }}>{o.desc}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionDivider({ title }) {
  return (
    <div style={{ margin: "36px 0 22px", borderTop: "2px solid #e5e7eb", paddingTop: 20 }}>
      <h2 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 17, fontWeight: 700, color: "#1a2b4a", margin: 0, letterSpacing: -0.2 }}>{title}</h2>
    </div>
  );
}

function HardwareRow({ hw, index, onUpdate, onRemove }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
      <input style={{ ...S.input, flex: 1, marginBottom: 0, fontSize: 13 }} placeholder="Equipment name" value={hw.name} onChange={(e) => onUpdate(index, "name", e.target.value)} />
      <input style={{ ...S.input, flex: 1, marginBottom: 0, fontSize: 13 }} placeholder="Notes" value={hw.notes} onChange={(e) => onUpdate(index, "notes", e.target.value)} />
      <button onClick={() => onRemove(index)} style={S.removeBtn}>×</button>
    </div>
  );
}

function StakeholderRow({ s, index, onUpdate, onRemove }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
      <input style={{ ...S.input, flex: 1, marginBottom: 0, fontSize: 13 }} placeholder="Name" value={s.name} onChange={(e) => onUpdate(index, "name", e.target.value)} />
      <input style={{ ...S.input, flex: 1, marginBottom: 0, fontSize: 13 }} placeholder="Role / Team" value={s.role} onChange={(e) => onUpdate(index, "role", e.target.value)} />
      <input style={{ ...S.input, flex: 1, marginBottom: 0, fontSize: 13 }} placeholder="Email" value={s.email} onChange={(e) => onUpdate(index, "email", e.target.value)} />
      <button onClick={() => onRemove(index)} style={S.removeBtn}>×</button>
    </div>
  );
}

/* ─── DOCX Generation via Anthropic API ─── */
async function generateDocxViaAPI(form, refFiles) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const refNum = `FTP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const riskLabel = RISK_LEVELS.find((r) => r.value === form.riskLevel)?.label || "TBD";
  const prioLabel = PRIORITY.find((p) => p.value === form.priority)?.label || "Standard";
  const testTypeLabel = form.testType === "Other" ? (form.otherTestType || "Other") : (form.testType || "TBD");
  const hw = form.hardware.filter((h) => h.name).map((h) => `${h.name}${h.notes ? " — " + h.notes : ""}`).join("; ") || "None listed";
  const stkh = form.stakeholders.filter((s) => s.name).map((s) => `${s.name}${s.role ? " (" + s.role + ")" : ""}${s.email ? " — " + s.email : ""}`).join("; ") || "TBD";
  const fileNames = refFiles.map((f) => f.name).join(", ") || "None attached";

  const prompt = `Generate ONLY valid JavaScript code using the "docx" npm library (CommonJS require) that creates a professional Flight Test Plan Request document. Output ONLY code — no markdown fences, no explanation.

The code MUST:
- require("docx") and require("fs")
- Use Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer, HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType, PageNumber, PageBreak, LevelFormat from docx
- Write to "request.docx" via Packer.toBuffer
- US Letter (width:12240, height:15840 DXA), 1 inch margins (1440)
- Arial font, 12pt default
- NEVER use unicode bullets — use LevelFormat.BULLET with numbering config
- Set table width with WidthType.DXA (9360 for full width), columnWidths array, AND width on each cell
- Use ShadingType.CLEAR for shading (never SOLID)
- Add cell margins: { top:80, bottom:80, left:120, right:120 }

Document structure:

PAGE 1 — TITLE PAGE:
- Large centered title: "Flight Test Plan Request"
- Subtitle: "${form.title || "Untitled"}"
- Reference: ${refNum}
- Date: ${today}
- Then a PageBreak

PAGE 2+ — CONTENT:

HEADING 1: "1. Request Overview"
Create a 2-column table (col1=3000 DXA, col2=6360 DXA) with light gray header row (fill "D5E8F0") for these rows:
| Field | Value |
| Test Plan Title | ${form.title || "TBD"} |
| Test Type | ${testTypeLabel} |
| Requestor | ${form.requestorName || "TBD"} |
| Team / Dept | ${form.requestorTeam || "TBD"} |
| Email | ${form.requestorEmail || "TBD"} |
| Risk Level | ${riskLabel} |
| Priority | ${prioLabel} |

HEADING 1: "2. System Under Test"
HEADING 2: "System Overview"
Paragraph: ${JSON.stringify(form.systemDescription || "TBD")}

HEADING 2: "Test Objective"
Paragraph: ${JSON.stringify(form.testObjective || "TBD")}

HEADING 2: "Aircraft / Vehicle Configuration"
Paragraph: ${JSON.stringify(form.aircraftConfig || "TBD")}

HEADING 2: "Software / Firmware Version"
Paragraph: ${JSON.stringify(form.softwareVersion || "TBD")}

HEADING 2: "Equipment Under Test (EUT)"
Paragraph: ${JSON.stringify(form.eut || "TBD")}

HEADING 2: "Additional Hardware / Instrumentation"
Bullet list: ${hw}

HEADING 2: "Configuration Notes"
Paragraph: ${JSON.stringify(form.configNotes || "None")}

HEADING 1: "3. Logistics"
HEADING 2: "Key Stakeholders"
Paragraph: ${stkh}

HEADING 2: "Estimated Duration"
Paragraph: ${JSON.stringify(form.estimatedDuration || "TBD")}

HEADING 2: "Test Location"
Paragraph: ${JSON.stringify(form.testLocation || "TBD")}

HEADING 2: "Environmental Constraints"
Paragraph: ${JSON.stringify(form.environmentalConstraints || "None specified")}

HEADING 2: "Additional Notes"
Paragraph: ${JSON.stringify(form.additionalNotes || "None")}

HEADING 1: "4. Reference Documents"
Paragraph: ${JSON.stringify(fileNames)}

HEADING 1: "5. FTE Use Only"
Add italic gray text: "The following sections are to be completed by the Flight Test Engineer."
Then these HEADING 2 subsections, each with placeholder text "TBD — To be completed by FTE":
- Flight Test Hazards & Risk Assessment
- Test Phases & Test Points
- Pass/Fail Criteria
- Pre-Test Checklist
- Post-Test Checklist
- Abort Procedures
- Post-Test Analysis

Add a footer with page numbers centered.
Output ONLY the code.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const code = data.content.map((c) => (c.type === "text" ? c.text : "")).join("").replace(/```javascript|```js|```/g, "").trim();
  return { code, refNum, riskLabel, prioLabel, testTypeLabel, hw, stkh, fileNames, today };
}

/* ─── Main Component ─── */
export default function TestPlanRequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [shake, setShake] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [refNum, setRefNum] = useState("");
  const [docxBlob, setDocxBlob] = useState(null);
  const topRef = useRef(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "", testType: "", otherTestType: "",
    requestorName: "", requestorTeam: "", requestorEmail: "",
    priority: "standard", riskLevel: "",
    systemDescription: "", testObjective: "",
    softwareVersion: "", aircraftConfig: "", eut: "",
    hardware: [{ name: "", notes: "" }],
    configNotes: "",
    stakeholders: [{ name: "", role: "", email: "" }],
    estimatedDuration: "", testLocation: "",
    environmentalConstraints: "",
    additionalNotes: "",
  });
  const [refFiles, setRefFiles] = useState([]);

  const u = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));
  const updateListItem = (field) => (index, key, val) => {
    setForm((f) => { const a = [...f[field]]; a[index] = { ...a[index], [key]: val }; return { ...f, [field]: a }; });
  };
  const addListItem = (field, tpl) => () => setForm((f) => ({ ...f, [field]: [...f[field], { ...tpl }] }));
  const removeListItem = (field) => (index) => {
    setForm((f) => { const a = f[field].filter((_, i) => i !== index); return { ...f, [field]: a.length ? a : [Object.fromEntries(Object.keys(f[field][0]).map((k) => [k, ""]))] }; });
  };

  const handleFileChange = (e) => { setRefFiles((p) => [...p, ...Array.from(e.target.files)]); e.target.value = ""; };
  const removeFile = (i) => setRefFiles((p) => p.filter((_, idx) => idx !== i));

  const validate = () => {
    const m = [];
    if (!form.title) m.push("Test Plan Title");
    if (!form.testType) m.push("Test Type");
    if (!form.requestorName) m.push("Your Name");
    if (!form.requestorEmail) m.push("Email");
    if (!form.riskLevel) m.push("Risk Level");
    if (!form.testObjective) m.push("Test Objective");
    return m;
  };

  /* Build a plain-text fallback document */
  function buildPlainText(info) {
    const f = form;
    const hw = f.hardware.filter((h) => h.name).map((h) => `  - ${h.name}${h.notes ? ` — ${h.notes}` : ""}`).join("\n") || "  None listed";
    const sk = f.stakeholders.filter((s) => s.name).map((s) => `  - ${s.name}${s.role ? ` (${s.role})` : ""}${s.email ? ` — ${s.email}` : ""}`).join("\n") || "  TBD";
    const fn = refFiles.map((fi) => `  - ${fi.name}`).join("\n") || "  None attached";
    return `\n  FLIGHT TEST PLAN REQUEST\n  ${info.refNum}\n  ${info.today}\n\nTITLE: ${f.title || "TBD"}\n\n1. REQUEST OVERVIEW\n  Test Type:        ${info.testTypeLabel}\n  Requestor:        ${f.requestorName || "TBD"}\n  Team / Dept:      ${f.requestorTeam || "TBD"}\n  Email:            ${f.requestorEmail || "TBD"}\n  Risk Level:       ${info.riskLabel}\n  Priority:         ${info.prioLabel}\n\n2. SYSTEM UNDER TEST\n  System Overview:\n    ${f.systemDescription || "TBD"}\n\n  Test Objective:\n    ${f.testObjective || "TBD"}\n\n  Aircraft Config:  ${f.aircraftConfig || "TBD"}\n  SW / FW Version:  ${f.softwareVersion || "TBD"}\n\n  EUT:\n    ${f.eut || "TBD"}\n\n  Additional Hardware:\n${hw}\n\n  Config Notes:\n    ${f.configNotes || "None"}\n\n3. LOGISTICS\n  Stakeholders:\n${sk}\n\n  Duration:         ${f.estimatedDuration || "TBD"}\n  Location:         ${f.testLocation || "TBD"}\n\n  Environmental Constraints:\n    ${f.environmentalConstraints || "None specified"}\n\n  Notes:\n    ${f.additionalNotes || "None"}\n\n4. REFERENCE DOCUMENTS\n${fn}\n\n5. FTE USE ONLY\n  Flight Test Hazards & Risk Assessment:  TBD\n  Test Phases & Test Points:  TBD\n  Pass/Fail Criteria:  TBD\n  Pre-Test Checklist:  TBD\n  Post-Test Checklist:  TBD\n  Abort Procedures:  TBD\n  Post-Test Analysis:  TBD\n`;
  }

  const handleSubmit = async () => {
    const missing = validate();
    if (missing.length > 0) {
      setMissingFields(missing);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      topRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setMissingFields([]);
    setGenerating(true);

    try {
      const info = await generateDocxViaAPI(form, refFiles);
      setRefNum(info.refNum);

      // Try to dynamically run the code to produce the docx in-browser
      // Since we can't run Node in browser, generate a downloadable text document
      const txt = buildPlainText(info);
      setDocxBlob(new Blob([txt], { type: "text/plain" }));
    } catch (err) {
      console.error(err);
      const num = `FTP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      setRefNum(num);
      const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const riskLabel = RISK_LEVELS.find((r) => r.value === form.riskLevel)?.label || "TBD";
      const prioLabel = PRIORITY.find((p) => p.value === form.priority)?.label || "Standard";
      const testTypeLabel = form.testType === "Other" ? (form.otherTestType || "Other") : (form.testType || "TBD");
      const txt = buildPlainText({ refNum: num, today, riskLabel, prioLabel, testTypeLabel });
      setDocxBlob(new Blob([txt], { type: "text/plain" }));
    }

    setGenerating(false);
    setSubmitted(true);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const downloadDoc = () => {
    if (!docxBlob) return;
    const url = URL.createObjectURL(docxBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Flight_Test_Plan_Request_${refNum}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const emailDoc = () => {
    const subject = encodeURIComponent(`Flight Test Plan Request: ${form.title} [${refNum}]`);
    const body = encodeURIComponent(
      `A new flight test plan request has been submitted.\n\nTitle: ${form.title}\nReference: ${refNum}\nRequestor: ${form.requestorName} (${form.requestorTeam})\nRisk Level: ${RISK_LEVELS.find((r) => r.value === form.riskLevel)?.label || "TBD"}\nPriority: ${PRIORITY.find((p) => p.value === form.priority)?.label || "Standard"}\n\nPlease find the full request document attached.\n\n---\nTest Objective:\n${form.testObjective}\n\nSystem Overview:\n${form.systemDescription}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  /* ── Submitted View ── */
  if (submitted) {
    return (
      <div style={S.page}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
        <div ref={topRef} />
        <div style={S.successCard}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>&#9992;&#65039;</div>
          <h1 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 24, fontWeight: 700, color: "#1a2b4a", margin: 0 }}>Request Submitted</h1>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#6b7280", margin: "10px 0 0", lineHeight: 1.6 }}>
            Your flight test plan request for <strong style={{ color: "#1a2b4a" }}>{form.title}</strong> has been received.
          </p>
          <div style={{ margin: "20px 0", padding: "14px 20px", background: "#f8f9fb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Reference Number</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 500, color: "#1a2b4a", letterSpacing: 1 }}>{refNum}</div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
            <button onClick={downloadDoc} style={{ ...S.primaryBtn, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>&#128196;</span> Download Request Document
            </button>
            <button onClick={emailDoc} style={{ ...S.secondaryBtn, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>&#9993;&#65039;</span> Email to FTE
            </button>
          </div>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#9ca3af", marginTop: 16, lineHeight: 1.5 }}>
            Download the document and attach it to the email, or share directly with the Flight Test Engineering team.
          </p>
          <button onClick={() => { setSubmitted(false); setDocxBlob(null); }} style={{ ...S.addBtn, marginTop: 24, padding: "10px 20px" }}>
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  /* ── Form View ── */
  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
      <div ref={topRef} />

      {/* Header */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={S.logo}>FTE</div>
          <div>
            <h1 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 22, fontWeight: 700, color: "#1a2b4a", margin: 0 }}>Flight Test Plan Request</h1>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#6b7280", margin: "2px 0 0" }}>Submit a new test plan to the Flight Test Engineering team</p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div style={S.noteBanner}>
        <span style={{ fontSize: 15 }}>&#128221;</span>
        <span>Only fields marked with <strong style={{ color: "#d1495b" }}>*</strong> are required. Fill in as much as you know — any additional detail helps the FTE get started faster.</span>
      </div>

      {/* Validation errors */}
      {missingFields.length > 0 && (
        <div style={{ ...S.noteBanner, background: "#fef2f2", borderColor: "#fecaca", color: "#991b1b", animation: shake ? "shake 0.4s" : "none" }}>
          <span style={{ fontSize: 15 }}>&#9888;&#65039;</span>
          <span>Please fill in required fields: {missingFields.join(", ")}</span>
        </div>
      )}

      {/* Form */}
      <div style={S.card}>

        {/* ── OVERVIEW ── */}
        <SectionDivider title="Request Overview" />
        <TextInput label="Test Plan Title" placeholder='e.g. "Helix State Estimator Validation"' value={form.title} onChange={u("title")} required />
        <SelectInput label="Test Type" options={TEST_TYPES} value={form.testType} onChange={u("testType")} required />
        {form.testType === "Other" && <TextInput label="Describe Test Type" placeholder="Briefly describe the type of test" value={form.otherTestType} onChange={u("otherTestType")} />}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <TextInput label="Your Name" placeholder="First Last" value={form.requestorName} onChange={u("requestorName")} required />
          <TextInput label="Team / Department" placeholder="e.g. GNC, Aeromech, Firmware" value={form.requestorTeam} onChange={u("requestorTeam")} />
        </div>
        <TextInput label="Email" placeholder="you@pivotal.aero" value={form.requestorEmail} onChange={u("requestorEmail")} required />
        <CardSelect label="Overall Risk Level" options={RISK_LEVELS} value={form.riskLevel} onChange={u("riskLevel")} required hint="Best estimate — FTE will confirm during planning." />
        <CardSelect label="Priority" options={PRIORITY} value={form.priority} onChange={u("priority")} />

        {/* ── SYSTEM UNDER TEST ── */}
        <SectionDivider title="System Under Test" />
        <TextInput label="System / Test Overview" multiline rows={4} placeholder="Describe what is being tested and why. Include enough context for someone unfamiliar with the project to understand the background." value={form.systemDescription} onChange={u("systemDescription")} hint="Think: What would a new FTE need to know to get started?" />
        <TextInput label="Test Objective" multiline rows={3} placeholder="What specific question(s) should this test answer? What are you trying to validate or demonstrate?" value={form.testObjective} onChange={u("testObjective")} required />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <TextInput label="Aircraft / Vehicle Configuration" placeholder='e.g. "Helix Pre-Alpha VER B, EIN 2002168"' value={form.aircraftConfig} onChange={u("aircraftConfig")} />
          <TextInput label="Software / Firmware Version" placeholder='e.g. "2026.09 or later"' value={form.softwareVersion} onChange={u("softwareVersion")} />
        </div>
        <TextInput label="Equipment Under Test (EUT)" multiline rows={2} placeholder="Describe the EUT — what it is, how it mounts, power draw, weight, any modifications needed." value={form.eut} onChange={u("eut")} hint="Include EIN, weight, mounting, and interface details if known." />

        <div style={{ marginBottom: 22 }}>
          <label style={S.label}>Additional Hardware / Instrumentation</label>
          <p style={S.hint}>List any special equipment, sensors, DAQ, or payload needed.</p>
          <div style={{ marginBottom: 8, display: "flex", gap: 8, fontSize: 12, color: "#6b7280", fontFamily: "'DM Sans',sans-serif" }}>
            <span style={{ flex: 1 }}>Equipment</span><span style={{ flex: 1 }}>Notes</span><span style={{ width: 32 }} />
          </div>
          {form.hardware.map((hw, i) => <HardwareRow key={i} hw={hw} index={i} onUpdate={updateListItem("hardware")} onRemove={removeListItem("hardware")} />)}
          <button onClick={addListItem("hardware", { name: "", notes: "" })} style={S.addBtn}>+ Add Equipment</button>
        </div>

        <TextInput label="Other Configuration Notes" multiline rows={2} placeholder="Any wiring changes, mounting modifications, payload considerations, etc." value={form.configNotes} onChange={u("configNotes")} />

        {/* ── LOGISTICS ── */}
        <SectionDivider title="Logistics" />
        <div style={{ marginBottom: 22 }}>
          <label style={S.label}>Key Stakeholders</label>
          <p style={S.hint}>Who should be involved in planning and review?</p>
          <div style={{ marginBottom: 8, display: "flex", gap: 8, fontSize: 12, color: "#6b7280", fontFamily: "'DM Sans',sans-serif" }}>
            <span style={{ flex: 1 }}>Name</span><span style={{ flex: 1 }}>Role / Team</span><span style={{ flex: 1 }}>Email</span><span style={{ width: 32 }} />
          </div>
          {form.stakeholders.map((s, i) => <StakeholderRow key={i} s={s} index={i} onUpdate={updateListItem("stakeholders")} onRemove={removeListItem("stakeholders")} />)}
          <button onClick={addListItem("stakeholders", { name: "", role: "", email: "" })} style={S.addBtn}>+ Add Stakeholder</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <TextInput label="Estimated Test Duration" placeholder='e.g. "3 flight days", "1 week"' value={form.estimatedDuration} onChange={u("estimatedDuration")} />
          <TextInput label="Test Location" placeholder='e.g. "Fort Hunter Liggett 12b"' value={form.testLocation} onChange={u("testLocation")} />
        </div>
        <TextInput label="Environmental Constraints" multiline rows={2} placeholder='e.g. "Wind < 15 mph on ground, density altitude limits, GPS coverage required, no rain"' value={form.environmentalConstraints} onChange={u("environmentalConstraints")} hint="Describe any weather, time-of-day, or environmental restrictions." />
        <TextInput label="Additional Notes" multiline rows={3} placeholder="Anything else the FTE should know — schedule constraints, dependencies, known risks, related test campaigns, etc." value={form.additionalNotes} onChange={u("additionalNotes")} />

        {/* ── REFERENCE DOCUMENTS ── */}
        <SectionDivider title="Reference Documents" />
        <p style={{ ...S.hint, marginBottom: 12 }}>Upload any relevant standards, prior test plans, design docs, or supporting files.</p>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={S.dropZone}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#2d5cad"; e.currentTarget.style.background = "#f0f3f9"; }}
          onDragLeave={(e) => { e.currentTarget.style.borderColor = "#d0d4dc"; e.currentTarget.style.background = "#fafbfc"; }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = "#d0d4dc";
            e.currentTarget.style.background = "#fafbfc";
            setRefFiles((p) => [...p, ...Array.from(e.dataTransfer.files)]);
          }}
        >
          <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleFileChange} />
          <div style={{ fontSize: 28, marginBottom: 6 }}>&#128206;</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 500, color: "#1a2b4a" }}>Click to browse or drag files here</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#9ca3af", marginTop: 2 }}>PDF, DOCX, XLSX, images, or any relevant file type</div>
        </div>
        {refFiles.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {refFiles.map((f, i) => (
              <div key={i} style={S.fileChip}>
                <span style={{ fontSize: 14 }}>&#128196;</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#1a2b4a", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#9ca3af" }}>{(f.size / 1024).toFixed(0)} KB</span>
                <button onClick={() => removeFile(i)} style={{ ...S.removeBtn, width: 24, height: 24, fontSize: 16 }}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* ── SUBMIT ── */}
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: "2px solid #e5e7eb", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
          {generating && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #d0d4dc", borderTopColor: "#2d5cad", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Generating document…
          </span>}
          <button onClick={handleSubmit} disabled={generating} style={{
            ...S.primaryBtn,
            background: generating ? "#9ca3af" : "#1a2b4a",
            cursor: generating ? "not-allowed" : "pointer",
            padding: "14px 36px", fontSize: 15,
          }}>
            {generating ? "Generating…" : "Submit Request"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus,textarea:focus,select:focus { outline:none; border-color:#2d5cad !important; box-shadow:0 0 0 3px rgba(45,92,173,0.1); }
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#d0d4dc;border-radius:3px}
      `}</style>
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#f3f4f6", padding: "24px 16px 80px", maxWidth: 780, margin: "0 auto", fontFamily: "'DM Sans',sans-serif" },
  header: { marginBottom: 16, padding: "20px 24px", background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  logo: { width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#1a2b4a 0%,#2d5cad 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: 1 },
  noteBanner: { display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", marginBottom: 16, background: "#fefce8", borderRadius: 10, border: "1px solid #fde68a", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#92400e", lineHeight: 1.5 },
  card: { background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "8px 28px 28px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  label: { display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: "#1a2b4a", marginBottom: 4 },
  hint: { fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#9ca3af", margin: "0 0 8px", lineHeight: 1.4 },
  input: { display: "block", width: "100%", padding: "10px 12px", border: "1.5px solid #d0d4dc", borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#1a2b4a", background: "#fafbfc", transition: "border-color 0.15s,box-shadow 0.15s", boxSizing: "border-box" },
  primaryBtn: { padding: "12px 28px", border: "none", borderRadius: 10, background: "#1a2b4a", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "background 0.15s" },
  secondaryBtn: { padding: "12px 28px", border: "1.5px solid #d0d4dc", borderRadius: 10, background: "#fff", color: "#1a2b4a", fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  addBtn: { padding: "6px 14px", border: "1.5px dashed #d0d4dc", borderRadius: 8, background: "transparent", color: "#6b7280", fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer", marginTop: 4 },
  removeBtn: { width: 32, height: 38, border: "none", background: "transparent", color: "#d1495b", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, flexShrink: 0 },
  dropZone: { padding: "28px 20px", border: "2px dashed #d0d4dc", borderRadius: 12, background: "#fafbfc", cursor: "pointer", textAlign: "center", transition: "border-color 0.15s,background 0.15s" },
  fileChip: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 6, borderRadius: 8, background: "#f8f9fb", border: "1px solid #e5e7eb" },
  successCard: { background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "44px 36px", textAlign: "center", maxWidth: 520, margin: "40px auto 0", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" },
};

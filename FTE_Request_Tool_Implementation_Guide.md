# FTE Request Tool — Implementation & Maintenance Guide

**Flight Test Plan Request Form**
**Prepared: March 2026**

---

> This document contains everything needed to deploy, maintain, and extend the Flight Test Plan Request tool. Keep it with the project files so anyone on the team can pick up where you left off.

---

## 1. Project Overview

The FTE Request Tool is a web-based form that allows any Pivotal engineering team to submit flight test plan requests to the Flight Test Engineering (FTE) team. It runs as a single HTML file — no server, no database, no build step.

**What it does:**

- Structured intake form for test plan requests (overview, system under test, logistics, stakeholders, reference docs)
- Automatically sends the completed request to the FTE via email on submission
- Generates a downloadable request document for records
- Assigns a unique reference number (FTP-YYYY-XXXX) to each submission

**Files in this project:**

| File | Purpose |
|------|---------|
| `index.html` | The live application (renamed from fte-request-tool.html for GitHub Pages) |
| `test-plan-request.jsx` | The editable React source code (for future changes via Claude) |
| This guide | Deployment, setup, maintenance, and future roadmap |

---

## 2. Deploying to GitHub Pages

Since Pivotal already uses GitHub, GitHub Pages is the simplest way to get a stable URL that anyone on the team can access.

### Step 1: Create the Repository

1. Go to your Pivotal GitHub organization (or your personal GitHub)
2. Click **New Repository**
3. Name it: `fte-request-tool`
4. Set visibility: **Public** (required for free GitHub Pages) or **Private** (if your org has GitHub Enterprise/Pro)
5. Check **"Add a README"**
6. Click **Create repository**

### Step 2: Upload the Files

1. In the repo, click **Add file → Upload files**
2. Upload these files:
   - `index.html` (the HTML application — **must be named index.html** for GitHub Pages)
   - `test-plan-request.jsx` (source code for future edits)
   - This guide document
3. Click **Commit changes**

### Step 3: Enable GitHub Pages

1. Go to the repo **Settings** tab
2. In the left sidebar, click **Pages**
3. Under "Source", select **Deploy from a branch**
4. Branch: **main**, Folder: **/ (root)**
5. Click **Save**
6. Wait 1-2 minutes. GitHub will show a green banner with your URL:
   - `https://[your-org].github.io/fte-request-tool/`

### Step 4: Test the Live URL

1. Open the URL in your browser
2. Fill out a test submission
3. Verify the email opens (or sends, if EmailJS is configured)
4. Share the URL with a colleague to confirm it works from another machine

### Step 5: Add to the Pivotal Portal

Send this message to whoever manages the Google Sites portal (or post in the relevant Slack channel):

> "Can you add a button to the **Requests** section on the Pivotal portal? Label it **'Flight Test Plan Request'** and link it to: `https://[your-org].github.io/fte-request-tool/`
>
> It's a request form for engineering teams to submit test plans to Flight Test — same concept as the MRO and Tech Pubs request buttons already on the page."

The button should go right next to the existing MRO and Technical Publication request buttons.

---

## 3. Setting Up Email Delivery

The form has two email delivery modes. It ships with the **mailto fallback** active, which works immediately with no setup. For a better experience, set up **EmailJS** for fully automatic delivery.

### Mode 1: Mailto Fallback (works out of the box)

When someone submits the form, their default email client (Outlook, Gmail, etc.) opens with a pre-filled email addressed to `eben.butler@pivotal.aero`. The requestor just clicks Send.

**Pros:** No setup needed, works immediately.
**Cons:** Requires the user to click Send. Won't work if they don't have a mail client configured.

### Mode 2: EmailJS (recommended — fully automatic)

EmailJS sends the email silently in the background. The requestor clicks Submit and the request is delivered. No email client needed.

**Setup steps (10 minutes, free tier handles 200 emails/month):**

1. Go to [https://www.emailjs.com](https://www.emailjs.com) and create a free account
2. **Add an Email Service:**
   - Click "Email Services" → "Add New Service"
   - Choose your email provider (Gmail, Outlook, etc.)
   - Connect it (this is the account emails will be *sent from* — could be a shared team account like `flight-test-requests@pivotal.aero`)
   - Note the **Service ID** (e.g., `service_abc123`)

3. **Create an Email Template:**
   - Click "Email Templates" → "Create New Template"
   - Set the **To Email** to: `{{to_email}}`
   - Set the **Subject** to: `{{subject}}`
   - Set the **Body** to something like:

   ```
   New Flight Test Plan Request: {{title}}
   Reference: {{ref_number}}

   Requestor: {{requestor}} ({{requestor_email}})
   Test Type: {{test_type}}
   Risk Level: {{risk_level}}
   Priority: {{priority}}

   ─────────────────────────────
   SYSTEM UNDER TEST

   Overview: {{system_overview}}

   Objective: {{test_objective}}

   Aircraft: {{aircraft_config}}
   SW/FW: {{sw_version}}
   EUT: {{eut}}
   Hardware: {{hardware}}
   Config Notes: {{config_notes}}

   ─────────────────────────────
   LOGISTICS

   Stakeholders: {{stakeholders}}
   Duration: {{duration}}
   Location: {{location}}
   Env Constraints: {{env_constraints}}
   Notes: {{notes}}
   Ref Documents: {{ref_documents}}
   ```

   - Click **Save**
   - Note the **Template ID** (e.g., `template_xyz789`)

4. **Get your Public Key:**
   - Go to "Account" → "API Keys"
   - Copy the **Public Key**

5. **Update the HTML file:**
   - Open `index.html` in a text editor
   - Find the `CONFIG` object near the top of the `<script>` section
   - Replace the three placeholder values:

   ```javascript
   const CONFIG = {
     EMAILJS_PUBLIC_KEY: "your_actual_public_key",
     EMAILJS_SERVICE_ID: "service_abc123",
     EMAILJS_TEMPLATE_ID: "template_xyz789",
     FTE_EMAIL: "eben.butler@pivotal.aero",
     FTE_NAME: "Eben Butler",
     USE_EMAILJS: true,  // ← Change this to true
   };
   ```

6. **Commit the updated file to GitHub** and the change goes live automatically.

### Changing the Recipient

To change who receives submissions, edit the `CONFIG` section:

```javascript
FTE_EMAIL: "new.person@pivotal.aero",
FTE_NAME: "New Person",
```

Commit to GitHub and it takes effect immediately.

---

## 4. Making Changes

### Quick Text Changes (no coding needed)

Open `index.html` in any text editor (VS Code, Notepad++, even GitHub's web editor) and search for what you want to change:

| Change | What to search for |
|--------|--------------------|
| Add a test type | `TEST_TYPES` array |
| Change risk levels | `RISK_LEVELS` array |
| Change priority options | `PRIORITY` array |
| Change recipient email | `FTE_EMAIL` in CONFIG |
| Update placeholder text | The placeholder text itself (e.g., "Fort Hunter Liggett") |
| Update the banner note | Search for "Only fields marked" |

After editing, commit to GitHub and the change is live within a minute.

### Bigger Changes (use Claude)

For structural changes (new fields, new sections, layout changes, new features), bring the source code back to Claude:

1. Open a new conversation at claude.ai
2. Upload `test-plan-request.jsx`
3. Describe what you want in plain English
4. Claude will update the JSX and let you preview it
5. Ask Claude to generate the final self-contained `index.html` file
6. Download and commit to GitHub

**Example prompts:**

- "Add a new field called Test Site Contact with name and phone number below Test Location"
- "Change Risk Level to have four levels, adding Critical as the highest"
- "Make the Equipment Under Test field required"
- "Add a date picker for Requested Test Date"
- "Change the generated document format to include a signature block"

**Important:** Always keep the `.jsx` source file updated alongside the HTML. The JSX is the clean, readable source. The HTML is the bundled deployable.

---

## 5. Future: Jira Integration

When you're ready to connect submissions to the Flight Operations Jira board:

### Recommended Approach: Power Automate Webhook

1. Create a Power Automate flow triggered by an HTTP webhook
2. Add a "Create Issue" action using the Jira connector
3. Map form fields to Jira fields (Summary, Description, Priority, Labels)
4. Update the HTML to POST form data to the webhook URL on submit
5. The form creates a Jira ticket AND sends the email

### Prompt for Claude When Ready

> "I have a flight test plan request form (uploading the .jsx source). I want to add Jira integration so that when someone submits the form, it creates a Jira ticket on our Flight Operations board. Our Jira project key is [KEY]. We use Power Automate. Please add the integration and keep the email delivery."

---

## 6. Maintenance

### File Locations

Keep all project files together in the GitHub repo:

- `index.html` — The live application
- `test-plan-request.jsx` — Editable React source
- `README.md` — Brief description and link to the live tool
- This guide document

### Update Procedure

1. Make changes (directly in HTML or via Claude for the JSX)
2. Test locally by opening the HTML in a browser
3. Commit to the GitHub repo
4. GitHub Pages auto-deploys within 1-2 minutes
5. Verify the live URL
6. Update this guide if the change was significant

### Key Contacts

| Role | Name | Notes |
|------|------|-------|
| Tool Owner / FTE | Eben Butler | Primary recipient, eben.butler@pivotal.aero |
| SharePoint Admin | [IT Contact] | For any SharePoint-related questions |
| Portal Admin | [Google Sites editor] | To add/update the button on the Pivotal portal |
| Backup | [Backup Name] | Can process requests when owner is unavailable |

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | March 2026 | Initial release — form with email delivery, GitHub Pages hosting |
| 1.1 | TBD | (Future) EmailJS automatic delivery |
| 1.2 | TBD | (Future) Jira integration |

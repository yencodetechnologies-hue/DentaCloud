/**
 * Step-by-step form wizards for voice/chat assistant.
 * Asks one field at a time, then confirms before save.
 */

function clean(text) {
  return String(text || "").trim();
}

function lower(text) {
  return clean(text).toLowerCase();
}

function extractPhone(text) {
  const m = String(text).match(/\b(\d{8,15})\b/);
  return m ? m[1] : "";
}

function extractGender(text) {
  const t = lower(text);
  if (/\bfemale\b|\bwoman\b|\blady\b/.test(t)) return "female";
  if (/\bmale\b|\bman\b|\bgentleman\b/.test(t)) return "male";
  if (/\bother\b/.test(t)) return "other";
  return "";
}

function extractDate(text) {
  const t = lower(text);
  const now = new Date();
  if (t.includes("today")) return now.toISOString().slice(0, 10);
  if (t.includes("tomorrow")) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  const iso = t.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const dmy = t.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (dmy) {
    const yy = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${yy}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  }
  // spoken: 15 july 1990 / july 15 1990
  const months = {
    january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
    may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8,
    september: 9, sep: 9, october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
  };
  const spoken = t.match(/\b(\d{1,2})\s+([a-z]+)\s+(19\d{2}|20\d{2})\b/) ||
    t.match(/\b([a-z]+)\s+(\d{1,2})\s+(19\d{2}|20\d{2})\b/);
  if (spoken) {
    let day; let monthName; let year;
    if (months[spoken[1]]) {
      monthName = spoken[1];
      day = Number(spoken[2]);
      year = Number(spoken[3]);
    } else {
      day = Number(spoken[1]);
      monthName = spoken[2];
      year = Number(spoken[3]);
    }
    const mm = months[monthName];
    if (mm && day >= 1 && day <= 31) {
      return `${year}-${String(mm).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  return "";
}

function isSkip(text) {
  return /^(skip|none|no|n\/a|na|pass|not now)\b/.test(lower(text));
}

function isCancel(text) {
  return /^(cancel|stop|abort|never mind|nevermind|quit)\b/.test(lower(text));
}

function isConfirm(text) {
  return /^(yes|yeah|yep|confirm|ok|okay|go ahead|proceed|do it|save|create)\b/.test(lower(text));
}

/** Field definitions per flow */
export const WIZARDS = {
  add_doctor: {
    tool: "add_doctor",
    label: "doctor",
    fields: [
      { key: "name", ask: "Sure! What is the doctor's full name?", required: true, parse: (t) => clean(t) },
      { key: "phone", ask: "What is their phone number?", required: true, parse: (t) => extractPhone(t) || (isSkip(t) ? "" : ""), validate: (v, raw) => (v || isSkip(raw) ? true : "Please say a valid phone number, or say skip.") },
      { key: "email", ask: "What is their email address? (or say skip)", required: false, parse: (t) => (isSkip(t) ? "" : clean(t).replace(/\s+/g, "")) },
      { key: "gender", ask: "What is their gender — male, female, or other?", required: true, parse: (t) => extractGender(t), validate: (v) => (v ? true : "Please say male, female, or other.") },
      { key: "dob", ask: "What is their date of birth? Example: 15 July 1990", required: true, parse: (t) => extractDate(t), validate: (v) => (v ? true : "Please say a date like 15 July 1990.") },
      { key: "address", ask: "What is their address?", required: true, parse: (t) => clean(t) },
      { key: "specialization", ask: "What is their specialization? Example: Orthodontist (or say skip)", required: false, parse: (t) => (isSkip(t) ? "" : clean(t)) },
      { key: "qualification", ask: "What is their qualification? Example: BDS, MDS (or say skip)", required: false, parse: (t) => (isSkip(t) ? "" : clean(t)) },
    ],
  },
  add_patient: {
    tool: "add_patient",
    label: "patient",
    fields: [
      { key: "name", ask: "Sure! What is the patient's full name?", required: true, parse: (t) => clean(t) },
      { key: "phone", ask: "What is their phone number?", required: true, parse: (t) => extractPhone(t), validate: (v) => (v ? true : "Please say a valid phone number.") },
      { key: "gender", ask: "What is their gender — male, female, or other?", required: true, parse: (t) => extractGender(t), validate: (v) => (v ? true : "Please say male, female, or other.") },
      { key: "email", ask: "What is their email? (or say skip)", required: false, parse: (t) => (isSkip(t) ? "" : clean(t).replace(/\s+/g, "")) },
      { key: "address", ask: "What is their address? (or say skip)", required: false, parse: (t) => (isSkip(t) ? "" : clean(t)) },
    ],
  },
  add_staff: {
    tool: "add_staff",
    label: "staff member",
    fields: [
      { key: "name", ask: "Sure! What is the staff member's full name?", required: true, parse: (t) => clean(t) },
      { key: "phone", ask: "What is their phone number?", required: true, parse: (t) => extractPhone(t) || (isSkip(t) ? "" : ""), validate: (v, raw) => (v || isSkip(raw) ? true : "Please say a valid phone number, or say skip.") },
      { key: "email", ask: "What is their email? (or say skip)", required: false, parse: (t) => (isSkip(t) ? "" : clean(t).replace(/\s+/g, "")) },
      { key: "gender", ask: "What is their gender — male, female, or other? (or say skip)", required: false, parse: (t) => extractGender(t) || (isSkip(t) ? "" : ""), validate: (v, raw) => (v || isSkip(raw) ? true : "Please say male, female, other, or skip.") },
      {
        key: "role",
        ask: "What is their staff type — Admin, CSA, Housekeeping, or Security?",
        required: true,
        parse: (t) => {
          const w = ["admin", "csa", "housekeeping", "security"].find((x) => lower(t).includes(x));
          if (!w) return clean(t) || "Admin";
          return w[0].toUpperCase() + w.slice(1);
        },
      },
    ],
  },
  book_appointment: {
    tool: "book_appointment",
    label: "appointment",
    fields: [
      { key: "patientName", ask: "Which patient is this appointment for? Say the patient name.", required: true, parse: (t) => clean(t) },
      { key: "doctorName", ask: "Which doctor should they see?", required: true, parse: (t) => clean(t).replace(/^dr\.?\s*/i, "") },
      {
        key: "date",
        ask: "What date? You can say today, tomorrow, or a date like 20 July 2026.",
        required: true,
        parse: (t) => extractDate(t) || (lower(t).includes("today") || lower(t).includes("tomorrow") ? extractDate(t) : ""),
        validate: (v) => (v ? true : "Please say today, tomorrow, or a clear date."),
      },
      { key: "time", ask: "What time? Example: 10:30 AM (or say skip)", required: false, parse: (t) => (isSkip(t) ? "" : clean(t)) },
      { key: "treatment", ask: "Any treatment or reason? Example: Root canal (or say skip)", required: false, parse: (t) => (isSkip(t) ? "" : clean(t)) },
    ],
  },
};

function detectWizardStart(text) {
  const t = lower(text);
  if (/(add|create|new|register).*(doctor)/.test(t) || t === "add doctor") return "add_doctor";
  if (/(add|create|new|register).*(patient)/.test(t) || t === "add patient") return "add_patient";
  if (/(add|create|new|register).*(staff)/.test(t) || t === "add staff") return "add_staff";
  if (/(book|schedule|create|add).*(appointment)/.test(t) || t === "book appointment") return "book_appointment";
  return null;
}

function summarize(wizardKey, data) {
  const cfg = WIZARDS[wizardKey];
  const lines = cfg.fields
    .map((f) => {
      const val = data[f.key];
      if (val === undefined || val === null || val === "") return null;
      return `• ${f.key}: ${val}`;
    })
    .filter(Boolean);
  return `Please confirm — I'll save this ${cfg.label}:\n${lines.join("\n")}\n\nSay yes to save, or cancel to stop.`;
}

function startWizard(wizardKey) {
  const cfg = WIZARDS[wizardKey];
  return {
    reply: cfg.fields[0].ask,
    wizard: {
      type: wizardKey,
      step: 0,
      data: {},
      awaitingConfirm: false,
    },
  };
}

/**
 * Advance or start a wizard from user text + optional current wizard state.
 * @returns {{ reply, wizard?, pendingAction?, fnCall? } | null} null if not in/starting a wizard
 */
export function processWizard({ userText, wizard }) {
  const text = clean(userText);
  if (!text) return null;

  if (isCancel(text)) {
    if (wizard) {
      return { reply: "Cancelled. What else can I help you with?", wizard: null };
    }
    return null;
  }

  // Start a new wizard
  if (!wizard || wizard.awaitingConfirm === undefined) {
    const startKey = detectWizardStart(text);
    if (startKey) {
      // If user packed some info in the same sentence, still start from first missing field
      // but seed known values when possible
      const seeded = startWizard(startKey);
      const cfg = WIZARDS[startKey];
      const data = { ...seeded.wizard.data };

      if (startKey === "add_doctor" || startKey === "add_patient" || startKey === "add_staff") {
        const phone = extractPhone(text);
        if (phone) data.phone = phone;
        const gender = extractGender(text);
        if (gender) data.gender = gender;
        const nameMatch = text.match(/(?:doctor|patient|staff)(?:\s+named)?\s+(.+?)(?:\s+phone|\s+\d{8,}|\s+male|\s+female|$)/i);
        if (nameMatch?.[1] && !/^(named)?$/i.test(nameMatch[1].trim())) {
          data.name = clean(nameMatch[1]);
        }
      }

      // Find first missing required/optional field to ask
      let step = 0;
      while (step < cfg.fields.length && data[cfg.fields[step].key] !== undefined && data[cfg.fields[step].key] !== "") {
        step += 1;
      }
      if (step >= cfg.fields.length) {
        return {
          reply: summarize(startKey, data),
          wizard: { type: startKey, step, data, awaitingConfirm: true },
          pendingAction: { tool: cfg.tool, params: mapParams(startKey, data) },
        };
      }
      return {
        reply: data[cfg.fields[0].key] ? `Got it. ${cfg.fields[step].ask}` : cfg.fields[step].ask,
        wizard: { type: startKey, step, data, awaitingConfirm: false },
      };
    }
    if (!wizard) return null;
  }

  const cfg = WIZARDS[wizard.type];
  if (!cfg) return { reply: "Something went wrong with the form. Please say add doctor again.", wizard: null };

  // Confirm step
  if (wizard.awaitingConfirm) {
    if (isConfirm(text)) {
      return {
        reply: `Saving the ${cfg.label} now…`,
        wizard: null,
        pendingAction: { tool: cfg.tool, params: mapParams(wizard.type, wizard.data) },
        autoConfirm: true,
      };
    }
    return {
      reply: "Please say yes to save, or cancel to stop.",
      wizard,
      pendingAction: { tool: cfg.tool, params: mapParams(wizard.type, wizard.data) },
    };
  }

  // Fill current field
  const field = cfg.fields[wizard.step];
  if (!field) {
    return {
      reply: summarize(wizard.type, wizard.data),
      wizard: { ...wizard, awaitingConfirm: true },
      pendingAction: { tool: cfg.tool, params: mapParams(wizard.type, wizard.data) },
    };
  }

  const value = field.parse(text);
  if (field.validate) {
    const ok = field.validate(value, text);
    if (ok !== true) {
      return { reply: typeof ok === "string" ? ok : field.ask, wizard };
    }
  } else if (field.required && !value) {
    return { reply: `I need that detail. ${field.ask}`, wizard };
  }

  const data = { ...wizard.data, [field.key]: value };
  let nextStep = wizard.step + 1;

  if (nextStep >= cfg.fields.length) {
    return {
      reply: summarize(wizard.type, data),
      wizard: { type: wizard.type, step: nextStep, data, awaitingConfirm: true },
      pendingAction: { tool: cfg.tool, params: mapParams(wizard.type, data) },
    };
  }

  return {
    reply: `Got it. ${cfg.fields[nextStep].ask}`,
    wizard: { type: wizard.type, step: nextStep, data, awaitingConfirm: false },
  };
}

function mapParams(wizardKey, data) {
  if (wizardKey === "book_appointment") {
    return {
      patientName: data.patientName,
      doctorName: data.doctorName,
      date: data.date,
      time: data.time || "",
      treatment: data.treatment || "",
    };
  }
  if (wizardKey === "add_doctor") {
    return {
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      gender: data.gender || undefined,
      dob: data.dob || undefined,
      address: data.address || undefined,
      specialization: data.specialization || undefined,
      qualification: data.qualification || undefined,
    };
  }
  if (wizardKey === "add_patient") {
    return {
      name: data.name,
      phone: data.phone,
      gender: data.gender,
      email: data.email || undefined,
      address: data.address || undefined,
    };
  }
  if (wizardKey === "add_staff") {
    return {
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      gender: data.gender || undefined,
      role: data.role || "Admin",
    };
  }
  return { ...data };
}

export function isWizardIntent(text) {
  return Boolean(detectWizardStart(text));
}

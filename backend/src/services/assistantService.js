import { executeTool, TOOL_DECLARATIONS, toolNeedsConfirmation } from "./assistantTools.js";
import { processWizard } from "./assistantWizard.js";

const SYSTEM_PROMPT = `You are Denta Cloud AI Assistant — a friendly clinic admin copilot.

CRITICAL RULE for creating records (doctor, patient, staff, appointment):
- Ask for ONE field at a time. Never ask for multiple fields in one message.
- Collect all needed details step by step.
- After every field is collected, summarize and ask for confirmation before calling any create/book tool.
- Only call tools after the user confirms (yes/confirm).

Doctor fields (ask in this order): name → phone → email → gender → date of birth → address → specialization → qualification → confirm.
Patient fields: name → phone → gender → email → address → confirm.
Staff fields: name → phone → email → gender → staff type → confirm.
Appointment fields: patient name → doctor name → date → time → treatment → confirm.

Also help with: navigation, search, greetings.
Keep replies short (1-2 sentences). Today's date is ${new Date().toISOString().slice(0, 10)}.`;

function envKey(name) {
  const v = String(process.env[name] || "").trim();
  return v || null;
}

function getProvider() {
  const prefer = String(process.env.ASSISTANT_PROVIDER || "").trim().toLowerCase();
  const hasOpenAI = Boolean(envKey("OPENAI_API_KEY"));
  const hasGemini = Boolean(envKey("GEMINI_API_KEY"));

  if (prefer === "openai" && hasOpenAI) return "openai";
  if (prefer === "gemini" && hasGemini) return "gemini";
  if (prefer === "local") return "local";

  // Default: OpenAI first (more reliable), then Gemini, then local rules
  if (hasOpenAI) return "openai";
  if (hasGemini) return "gemini";
  return "local";
}

function toGeminiContents(messages) {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
}

async function callGemini(messages) {
  const key = envKey("GEMINI_API_KEY");
  const model = envKey("GEMINI_MODEL") || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: toGeminiContents(messages),
    tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
    toolConfig: { functionCallingConfig: { mode: "AUTO" } },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const text = parts.find((p) => p.text)?.text || "";
  const fnCall = parts.find((p) => p.functionCall)?.functionCall;
  return { text, fnCall };
}

async function callOpenAI(messages) {
  const key = envKey("OPENAI_API_KEY");
  const model = envKey("OPENAI_MODEL") || "gpt-4o-mini";

  const tools = TOOL_DECLARATIONS.map((fn) => ({
    type: "function",
    function: {
      name: fn.name,
      description: fn.description,
      parameters: fn.parameters,
    },
  }));

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages.filter((m) => m.role !== "system")],
      tools,
      tool_choice: "auto",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0]?.message || {};
  const text = choice.content || "";
  const toolCall = choice.tool_calls?.[0];
  const fnCall = toolCall
    ? { name: toolCall.function.name, args: JSON.parse(toolCall.function.arguments || "{}") }
    : null;
  return { text, fnCall };
}

function localAssistantReply(messages) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const text = String(lastUser).toLowerCase().trim();

  if (!messages.some((m) => m.role === "user")) {
    return {
      text: "Hello! I'm your Denta Cloud assistant. How can I help you today? Say add doctor, add patient, add staff, or book appointment — I'll ask each detail one by one.",
      fnCall: null,
    };
  }

  if (text.includes("denta cloud") && text.includes("how can i help") && text.length > 60) {
    return {
      text: "Please say your request again — for example: add doctor, add patient, or open doctors page.",
      fnCall: null,
    };
  }

  if (/^(hi|hello|hey|good morning|good evening)\b/.test(text) && text.length < 40) {
    return {
      text: "Hello! How can I help you today? I can add a doctor, patient, or staff, or book an appointment — step by step.",
      fnCall: null,
    };
  }

  if (text.includes("help") || text.includes("what can you")) {
    return {
      text: "I can guide you step by step to:\n• Add doctor / patient / staff\n• Book appointment\n• Open pages\n\nSay \"add doctor\" to start.",
      fnCall: null,
    };
  }

  if (/(open|go to|show|navigate|take me to)\b/.test(text) && /(doctor|patient|staff|appointment|billing|dashboard)/.test(text)) {
    const page = text.includes("doctor")
      ? "doctors"
      : text.includes("patient")
        ? "patients"
        : text.includes("staff")
          ? "staff"
          : text.includes("appointment")
            ? "appointments"
            : text.includes("billing")
              ? "billing"
              : "dashboard";
    return { text: `Opening the ${page} page.`, fnCall: { name: "navigate_page", args: { page } } };
  }

  return {
    text: "Try saying \"add doctor\", \"add patient\", \"add staff\", \"book appointment\", or \"open doctors page\". I'll ask each detail one by one.",
    fnCall: null,
  };
}

async function runProvider(messages) {
  const provider = getProvider();
  try {
    if (provider === "openai") return await callOpenAI(messages);
    if (provider === "gemini") return await callGemini(messages);
    return localAssistantReply(messages);
  } catch (err) {
    console.error(`[assistant] ${provider} failed:`, err.message);
    if (provider === "openai" && envKey("GEMINI_API_KEY")) {
      try {
        return await callGemini(messages);
      } catch (err2) {
        console.error("[assistant] gemini fallback failed:", err2.message);
      }
    }
    if (provider === "gemini" && envKey("OPENAI_API_KEY")) {
      try {
        return await callOpenAI(messages);
      } catch (err2) {
        console.error("[assistant] openai fallback failed:", err2.message);
      }
    }
    return localAssistantReply(messages);
  }
}

function parseFnArgs(fnCall) {
  if (!fnCall) return null;
  const args = fnCall.args || fnCall.arguments || {};
  if (typeof args === "string") {
    try {
      return { name: fnCall.name, params: JSON.parse(args) };
    } catch {
      return { name: fnCall.name, params: {} };
    }
  }
  return { name: fnCall.name, params: args };
}

export async function chatAssistant({ messages, req, confirmAction, wizard }) {
  const provider = getProvider();

  if (confirmAction) {
    const result = await executeTool(confirmAction.tool, confirmAction.params, req);
    return {
      reply: result.message,
      navigateTo: result.navigateTo || null,
      provider,
      actionExecuted: confirmAction.tool,
      wizard: null,
    };
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content || "";

  // Step-by-step wizard always takes priority for create/book flows
  const wizardResult = processWizard({ userText: lastUser, wizard: wizard || null });
  if (wizardResult) {
    if (wizardResult.autoConfirm && wizardResult.pendingAction) {
      const result = await executeTool(wizardResult.pendingAction.tool, wizardResult.pendingAction.params, req);
      return {
        reply: result.message,
        navigateTo: result.navigateTo || null,
        provider: "wizard",
        actionExecuted: wizardResult.pendingAction.tool,
        wizard: null,
      };
    }
    return {
      reply: wizardResult.reply,
      wizard: wizardResult.wizard,
      pendingAction: wizardResult.pendingAction || null,
      navigateTo: wizardResult.fnCall?.name === "navigate_page" ? undefined : null,
      provider: "wizard",
      fnCall: wizardResult.fnCall || null,
    };
  }

  // Handle navigate tool from wizard-style fnCall in local path via provider
  let { text, fnCall, pendingAction } = await runProvider(messages);

  if (pendingAction) {
    return { reply: text, pendingAction, provider, wizard: null };
  }

  const parsed = parseFnArgs(fnCall);
  if (!parsed) {
    return { reply: text || "How can I help you next?", provider, wizard: null };
  }

  if (toolNeedsConfirmation(parsed.name)) {
    return {
      reply:
        text ||
        `I can ${parsed.name.replace(/_/g, " ")} with these details. Should I go ahead and save it?`,
      pendingAction: parsed,
      provider,
      wizard: null,
    };
  }

  const result = await executeTool(parsed.name, parsed.params, req);
  const reply = text ? `${text}\n\n${result.message}` : result.message;
  return {
    reply,
    navigateTo: result.navigateTo || null,
    provider,
    actionExecuted: parsed.name,
    wizard: null,
  };
}

export function assistantStatus() {
  const provider = getProvider();
  return {
    provider,
    aiEnabled: provider !== "local",
    model:
      provider === "gemini"
        ? envKey("GEMINI_MODEL") || "gemini-2.0-flash"
        : provider === "openai"
          ? envKey("OPENAI_MODEL") || "gpt-4o-mini"
          : "local-rules",
    wizardEnabled: true,
  };
}

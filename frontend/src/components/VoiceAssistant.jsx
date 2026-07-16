import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiError } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

const WELCOME =
  "Hello! I'm your Denta Cloud AI assistant. How can I help you today? Say add doctor, add patient, add staff, or book appointment — I'll ask each detail one by one, then save after you confirm.";

const VOICE_REPLY_KEY = "dc_ai_voice_reply";
const HANDS_FREE_KEY = "dc_ai_hands_free";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function textForSpeech(text) {
  return String(text || "")
    .replace(/[•*#]/g, "")
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function VoiceAssistant() {
  const toast = useToast();
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const welcomeSpokenRef = useRef(false);
  const handsFreeRef = useRef(false);
  const voiceReplyRef = useRef(true);
  const openRef = useRef(false);
  const lastAssistantReplyRef = useRef("");
  const speakingRef = useRef(false);
  const busyRef = useRef(false);
  const listenAfterSpeakRef = useRef(false);
  const startListeningRef = useRef(() => {});

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceReply, setVoiceReply] = useState(() => localStorage.getItem(VOICE_REPLY_KEY) !== "0");
  const [handsFree, setHandsFree] = useState(() => localStorage.getItem(HANDS_FREE_KEY) !== "0");
  const [pendingAction, setPendingAction] = useState(null);
  const [wizard, setWizard] = useState(null);
  const [aiStatus, setAiStatus] = useState({ provider: "local", aiEnabled: false });
  const wizardRef = useRef(null);

  const SpeechRecognition = useMemo(
    () => window.SpeechRecognition || window.webkitSpeechRecognition || null,
    []
  );
  const speechSupported = useMemo(() => typeof window !== "undefined" && "speechSynthesis" in window, []);

  useEffect(() => {
    handsFreeRef.current = handsFree;
  }, [handsFree]);
  useEffect(() => {
    voiceReplyRef.current = voiceReply;
  }, [voiceReply]);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    wizardRef.current = wizard;
  }, [wizard]);

  useEffect(() => {
    if (!speechSupported) return;
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [speechSupported]);

  useEffect(() => {
    localStorage.setItem(VOICE_REPLY_KEY, voiceReply ? "1" : "0");
  }, [voiceReply]);

  useEffect(() => {
    localStorage.setItem(HANDS_FREE_KEY, handsFree ? "1" : "0");
  }, [handsFree]);

  function stopSpeaking() {
    if (speechSupported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function stopListening() {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
    setListening(false);
  }

  function pickVoice() {
    if (!speechSupported) return null;
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => v.lang === "en-IN") ||
      voices.find((v) => v.lang.startsWith("en-GB")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      null
    );
  }

  function scheduleListenAgain() {
    if (!handsFreeRef.current || !openRef.current) return;
    // Wait longer so speakers finish and we don't hear our own voice
    setTimeout(() => {
      if (
        handsFreeRef.current &&
        openRef.current &&
        !recognitionRef.current &&
        !speakingRef.current &&
        !busyRef.current
      ) {
        startListeningRef.current();
      }
    }, 900);
  }

  function speakText(text, { listenAfter = false } = {}) {
    listenAfterSpeakRef.current = listenAfter && handsFreeRef.current;
    lastAssistantReplyRef.current = textForSpeech(text);

    if (!voiceReplyRef.current || !speechSupported || !textForSpeech(text)) {
      if (listenAfterSpeakRef.current) scheduleListenAgain();
      return;
    }

    stopSpeaking();
    const utter = new SpeechSynthesisUtterance(textForSpeech(text));
    utter.lang = "en-IN";
    utter.rate = 0.95;
    utter.pitch = 1;
    const voice = pickVoice();
    if (voice) utter.voice = voice;

    utter.onstart = () => {
      speakingRef.current = true;
      setSpeaking(true);
    };
    utter.onend = () => {
      speakingRef.current = false;
      setSpeaking(false);
      if (listenAfterSpeakRef.current) scheduleListenAgain();
    };
    utter.onerror = () => {
      speakingRef.current = false;
      setSpeaking(false);
      if (listenAfterSpeakRef.current) scheduleListenAgain();
    };
    window.speechSynthesis.speak(utter);
  }

  function isEchoOfAssistant(transcript) {
    const t = textForSpeech(transcript).toLowerCase();
    const last = (lastAssistantReplyRef.current || "").toLowerCase();
    if (!t) return true;
    if (t.includes("denta cloud") && t.includes("how can i help")) return true;
    if (last && (t === last || (last.length > 20 && t.includes(last.slice(0, 40))))) return true;
    return false;
  }

  function pushAssistantMessage(content) {
    setMessages((prev) => [...prev, { id: uid(), role: "assistant", content }]);
    speakText(content, { listenAfter: true });
  }

  useEffect(() => {
    api.get("/assistant/status").then(({ data }) => setAiStatus(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ id: uid(), role: "assistant", content: WELCOME }]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (!open) {
      welcomeSpokenRef.current = false;
      stopSpeaking();
      stopListening();
      return;
    }
    if (open && messages.length === 1 && !welcomeSpokenRef.current) {
      welcomeSpokenRef.current = true;
      speakText(WELCOME, { listenAfter: true });
    }
  }, [open, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, pendingAction]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  async function sendToAssistant(userText, confirmAction = null) {
    if (busyRef.current && !confirmAction) return;
    stopSpeaking();
    stopListening();

    const nextMessages = userText
      ? [...messages, { id: uid(), role: "user", content: userText }]
      : messages;
    const chatHistory = nextMessages.map((m) => ({ role: m.role, content: m.content }));

    if (userText) setMessages(nextMessages);
    busyRef.current = true;
    setLoading(true);
    if (confirmAction) setPendingAction(null);

    try {
      const { data } = await api.post("/assistant/chat", {
        messages: chatHistory,
        confirmAction,
        wizard: confirmAction ? null : wizardRef.current,
      });

      const reply = data.reply || "How can I help you next?";
      setMessages((prev) => [...prev, { id: uid(), role: "assistant", content: reply }]);
      speakText(reply, { listenAfter: true });

      setWizard(data.wizard ?? null);
      wizardRef.current = data.wizard ?? null;

      if (data.pendingAction) setPendingAction(data.pendingAction);
      else if (data.actionExecuted || data.wizard === null) setPendingAction(null);

      if (data.navigateTo) navigate(data.navigateTo);
      if (data.actionExecuted) toast.success(reply);
    } catch (err) {
      const msg = apiError(err);
      const reply = `Sorry, something went wrong: ${msg}`;
      setMessages((prev) => [...prev, { id: uid(), role: "assistant", content: reply }]);
      speakText(reply, { listenAfter: true });
      toast.error(msg);
    } finally {
      busyRef.current = false;
      setLoading(false);
      setInput("");
    }
  }

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const lower = text.toLowerCase();
    if (pendingAction && /^(yes|yeah|yep|confirm|ok|okay|go ahead|proceed|do it)\b/.test(lower)) {
      await sendToAssistant(text, pendingAction);
      return;
    }
    if (pendingAction && /^(no|nope|cancel|stop|don't)\b/.test(lower)) {
      setPendingAction(null);
      setWizard(null);
      wizardRef.current = null;
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "user", content: text },
        { id: uid(), role: "assistant", content: "No problem — cancelled. What else can I help you with?" },
      ]);
      speakText("No problem — cancelled. What else can I help you with?", { listenAfter: true });
      setInput("");
      return;
    }

    await sendToAssistant(text);
  }

  async function handleConfirm(confirmed) {
    if (!pendingAction || loading) return;
    if (!confirmed) {
      setPendingAction(null);
      setWizard(null);
      wizardRef.current = null;
      pushAssistantMessage("Cancelled. Tell me what you'd like to do instead.");
      return;
    }
    await sendToAssistant("Yes, please confirm.", pendingAction);
  }

  function startVoiceInput() {
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser. Use Chrome or Edge.");
      return;
    }
    if (listening && recognitionRef.current) {
      stopListening();
      return;
    }

    stopSpeaking();

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognition.onerror = (event) => {
      setListening(false);
      recognitionRef.current = null;
      if (event.error === "aborted" || event.error === "no-speech") {
        if (handsFreeRef.current && openRef.current) scheduleListenAgain();
        return;
      }
      toast.error("Could not hear you. Please try again.");
      if (handsFreeRef.current && openRef.current) scheduleListenAgain();
    };
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      const cleaned = transcript.trim();
      if (!cleaned) {
        if (handsFreeRef.current) scheduleListenAgain();
        return;
      }
      // Ignore hearing our own AI voice (causes welcome loop)
      if (isEchoOfAssistant(cleaned) || speakingRef.current) {
        if (handsFreeRef.current) scheduleListenAgain();
        return;
      }
      sendToAssistant(cleaned);
    };

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
    }
  }

  startListeningRef.current = startVoiceInput;

  function togglePanel() {
    if (open) {
      stopSpeaking();
      stopListening();
    }
    setOpen((o) => !o);
  }

  function toggleVoiceReply() {
    setVoiceReply((v) => {
      if (v) stopSpeaking();
      return !v;
    });
  }

  function toggleHandsFree() {
    setHandsFree((v) => {
      const next = !v;
      if (next && openRef.current) {
        setTimeout(() => startListeningRef.current(), 300);
      } else {
        stopListening();
      }
      return next;
    });
  }

  function closePanel() {
    stopSpeaking();
    stopListening();
    setWizard(null);
    wizardRef.current = null;
    setPendingAction(null);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className={`icon-btn voice-btn voice-fab ${open || listening || speaking ? "is-listening" : ""}`}
        title="AI Assistant"
        onClick={togglePanel}
      >
        {listening ? "🔴" : speaking ? "🔊" : open ? "✕" : "🤖"}
      </button>

      {open && (
        <div className="ai-assistant-panel">
          <div className="ai-assistant-head">
            <div>
              <div className="ai-assistant-title">Denta AI</div>
              <div className="ai-assistant-sub">
                {aiStatus.aiEnabled
                  ? `Powered by ${aiStatus.provider}${handsFree ? " · continuous voice" : ""}`
                  : "Smart assistant (restart backend after adding API key)"}
              </div>
            </div>
            <div className="ai-assistant-actions">
              <button
                type="button"
                className={`ai-voice-toggle ${handsFree ? "is-on" : ""}`}
                onClick={toggleHandsFree}
                title={handsFree ? "Continuous voice ON" : "Continuous voice OFF"}
              >
                {handsFree ? "♾️" : "⏸️"}
              </button>
              {speaking && (
                <button type="button" className="ai-voice-toggle is-speaking" onClick={stopSpeaking} title="Stop speaking">
                  ⏹
                </button>
              )}
              <button
                type="button"
                className={`ai-voice-toggle ${voiceReply ? "is-on" : ""}`}
                onClick={toggleVoiceReply}
                title={voiceReply ? "Voice reply on" : "Voice reply off"}
              >
                {voiceReply ? "🔊" : "🔇"}
              </button>
              <button type="button" className="ai-close-btn" onClick={closePanel} aria-label="Close">
                ✕
              </button>
            </div>
          </div>

          {listening && <div className="ai-speaking-bar">Listening… speak now</div>}
          {speaking && !listening && <div className="ai-speaking-bar">Speaking…</div>}
          {wizard && !listening && !speaking && !loading && (
            <div className="ai-speaking-bar">
              Filling {String(wizard.type || "").replace(/_/g, " ")} — step {(wizard.step || 0) + 1}
              {wizard.awaitingConfirm ? " · confirm to save" : ""}
            </div>
          )}

          <div className="ai-chat-messages">
            {messages.map((m) => (
              <div key={m.id} className={`ai-message ${m.role === "user" ? "is-user" : "is-assistant"}`}>
                <div className="ai-message-bubble">{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="ai-message is-assistant">
                <div className="ai-message-bubble ai-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            {pendingAction && !loading && (
              <div className="ai-confirm-row">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => handleConfirm(true)}>
                  Yes, confirm
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleConfirm(false)}>
                  Cancel
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="ai-chat-input" onSubmit={handleSend}>
            <button
              type="button"
              className={`ai-mic-btn ${listening ? "is-active" : ""}`}
              onClick={startVoiceInput}
              title={listening ? "Stop mic" : "Speak once"}
            >
              🎤
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything… or use continuous voice"
              disabled={loading}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}

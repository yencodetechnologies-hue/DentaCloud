import { Router } from "express";
import { asyncHandler } from "../controllers/crudController.js";
import { assistantStatus, chatAssistant } from "../services/assistantService.js";
import { executeTool } from "../services/assistantTools.js";

const router = Router();

router.get(
  "/status",
  asyncHandler(async (_req, res) => {
    res.json(assistantStatus());
  })
);

router.post(
  "/chat",
  asyncHandler(async (req, res) => {
    const messages = Array.isArray(req.body.messages) ? req.body.messages : [];
    const confirmAction = req.body.confirmAction || null;
    const wizard = req.body.wizard || null;

    if (!messages.length && !confirmAction) {
      return res.json({
        reply:
          "Hello! I'm your Denta Cloud assistant. How can I help you today? Say add doctor, add patient, add staff, or book appointment — I'll ask each detail one by one.",
        provider: assistantStatus().provider,
        wizard: null,
      });
    }

    const result = await chatAssistant({ messages, req, confirmAction, wizard });

    if (result.fnCall?.name === "navigate_page") {
      const nav = await executeTool("navigate_page", result.fnCall.args || {}, req);
      return res.json({
        reply: result.reply || nav.message,
        navigateTo: nav.navigateTo,
        provider: result.provider,
        wizard: null,
      });
    }

    res.json({
      reply: result.reply,
      navigateTo: result.navigateTo || null,
      pendingAction: result.pendingAction || null,
      provider: result.provider,
      wizard: result.wizard ?? null,
      actionExecuted: result.actionExecuted || null,
    });
  })
);

export default router;

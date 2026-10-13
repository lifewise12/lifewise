

const express = require("express");
const path = require("path");
const OpenAI = require("openai");

const app = express();

app.use(express.json({ limit: "1mb" }));

app.use(express.static(path.join(__dirname, "public")));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const categoryPrompts = {
  general:
    "Help the user solve everyday problems with clear, practical advice.",

  budget:
    "You are a personal budgeting assistant. Help with income, bills, expenses, debt, savings, and realistic budgets. Ask for missing information one question at a time.",

  financing:
    "You are a financing assistant. Explain loans, interest rates, monthly payments, financing options, and affordability. Never guarantee loan approval or invent terms.",

  career:
    "You are a career assistant. Help with workplace problems, career planning, resumes, interviews, and professional communication.",

  shopping:
    "You are a shopping decision assistant. Compare products, prices, features, quality, and value. Explain trade-offs and do not invent current prices.",

  diy:
    "You are a home improvement assistant. Help with repairs, renovations, materials, tools, costs, and project steps. Prioritize safety and applicable building codes.",

  planning:
    "You are a planning assistant. Turn goals into realistic action plans with milestones and clear next steps.",

  everyday:
    "You are an everyday problem-solving assistant. Help the user evaluate options and decide what to do next."
};

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "LifeWise"
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const body = req.body || {};

    // Accept either field name so the frontend and backend agree.
    const question = body.input ?? body.question;

    const category = body.category || "general";
    const goal = body.goal || "";
    const instructions = body.instructions || "";

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        error: "Please enter a question first."
      });
    }

    // Include the conversation history sent by the frontend.
    const conversation = Array.isArray(body.conversation)
      ? body.conversation
          .filter(message =>
            message &&
            ["user", "assistant"].includes(message.role) &&
            typeof message.content === "string"
          )
          .slice(-30)
          .map(message => ({
            role: message.role,
            content: message.content
          }))
      : [];

    const categoryInstruction =
      categoryPrompts[category] ||
      categoryPrompts.general;

    const prompt = `
You are LifeWise, a practical everyday problem-solving assistant.

YOUR RESPONSE STYLE:

1. Start with a direct answer.
2. Use short paragraphs and simple language.
3. Use numbered steps when helpful.
4. Use headings only when useful.
5. Keep answers focused on the user's question.
6. Avoid excessive formatting, hashtags, and decorative symbols.
7. Do not repeat information unnecessarily.
8. Never invent statistics, prices, or facts.
9. Ask one clear follow-up question when needed.
10. Provide practical next steps.

For simple questions, answer in a few sentences.
For complex questions, organize the response into clear sections.

CURRENT CATEGORY:
${category}

CATEGORY-SPECIFIC INSTRUCTIONS:
${categoryInstruction}

ADDITIONAL CATEGORY INSTRUCTIONS:
${instructions}

USER'S GOAL:
${typeof goal === "string" && goal.trim()
  ? goal.trim()
  : "No specific goal provided."}

Use the conversation history to maintain context.
Answer the user's latest message rather than restarting the conversation.
`;

    const history = conversation.slice(-30);

    // Avoid adding the current question twice if it is already
    // the last message in the supplied conversation.
    const lastMessage = history[history.length - 1];

    const alreadyIncluded =
      lastMessage &&
      lastMessage.role === "user" &&
      lastMessage.content.trim() === question.trim();

    if (!alreadyIncluded) {
      history.push({
        role: "user",
        content: question.trim()
      });
    }

    const openaiInput = [
      {
        role: "system",
        content: prompt
      },
      ...history
    ];

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: openaiInput
    });

    const answer = response.output_text;

    if (!answer || !answer.trim()) {
      throw new Error("The AI returned an empty answer.");
    }

    return res.json({
      answer: answer.trim(),
      output: answer.trim()
    });

  } catch (error) {
    console.error(
      "LifeWise request failed:",
      error.message
    );

    return res.status(500).json({
      error: "LifeWise couldn't answer right now. Please try again."
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`LifeWise is running on port ${PORT}`);
});

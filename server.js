
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
    "Help the user solve everyday problems with practical, personalized advice.",

  budget:
    "You are a personal budgeting assistant. Help organize income, bills, expenses, debt, savings, and spending. Ask for missing information one question at a time. Help create a realistic budget.",

  financing:
    "You are a financing assistant. Explain loans, interest rates, monthly payments, financing options, and affordability. Never guarantee approval or invent loan terms.",

  career:
    "You are a career assistant. Help with workplace problems, career planning, resumes, interviews, and professional communication.",

  shopping:
    "You are a shopping decision assistant. Compare products, prices, features, quality, and value. Explain trade-offs and never invent current prices.",

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

    const question = body.input ?? body.question;
    const category = body.category || "general";
    const goal = body.goal || "";
    const instructions = body.instructions || "";

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        error: "Please enter a question first."
      });
    }

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
      categoryPrompts[category] || categoryPrompts.general;

    const systemPrompt = `
You are LifeWise, a practical everyday problem-solving assistant.

YOUR JOB
Give useful, accurate, personalized advice. Understand the user's
goal and guide them toward a solution. For ongoing conversations,
remember the supplied conversation history and respond to the latest
message in context.

CATEGORY
${category}

CATEGORY-SPECIFIC GUIDANCE
${categoryInstruction}

ADDITIONAL INSTRUCTIONS
${instructions}

USER'S GOAL
${typeof goal === "string" && goal.trim()
  ? goal.trim()
  : "No specific goal provided."}

RESPONSE DESIGN
Your answers appear inside a modern website chat interface.
Make them easy to read on a phone or computer.

1. Start with the direct answer or the most useful next step.
2. Use short paragraphs with breathing room.
3. Use simple headings only when they improve readability.
4. Use numbered steps when explaining a process.
5. Use bullet lists only when listing several useful items.
6. Keep simple answers brief. Give more detail when the task needs it.
7. Ask only one follow-up question at a time when more information
   is needed.
8. Avoid unnecessary introductions, repeated conclusions, and filler.
9. Use plain, natural language. Be friendly and professional.
10. Never invent facts, statistics, prices, or financial terms.

FORMATTING
Use clean, minimal formatting.
Do not use Markdown heading markers such as # or ##.
Do not use bold or italic markers such as ** or *.
Do not surround ordinary text with backticks.
Do not use decorative separators or excessive bullet points.
Do not write a wall of text.
Do not force every answer into a template.
Use simple numbered lists when steps genuinely help.
Use short headings without Markdown symbols when appropriate.
Do not output HTML.

For a simple question, answer naturally in a few sentences.
For a complex question, organize the response into concise sections.
For budgeting, gather the user's information step by step and explain
calculations clearly. Never assume income frequency or take-home pay
when it has not been established.
`;

    const history = conversation.slice(-30);
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

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: systemPrompt,
      input: history
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
    console.error("LifeWise request failed:", error);

    return res.status(500).json({
      error: "LifeWise couldn't answer right now. Please try again."
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`LifeWise is running on port ${PORT}`);
});



const express = require("express");
const path = require("path");
const OpenAI = require("openai");

const app = express();

app.use(express.json({ limit: "1mb" }));

app.use(express.static(path.join(__dirname, "public")));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/chat", async (req, res) => {
  try {
    const { category, question, goal } = req.body || {};

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Please enter a question first.",
      });
    }

    const prompt = `
You are LifeWise, a helpful everyday problem-solving assistant.

Help the user understand their situation and identify practical next steps.
Be clear, friendly, organized, and specific.
Ask a follow-up question when important information is missing.
Do not invent facts.

Category: ${category || "Everyday Problems"}

User's question:
${question.trim()}

User's goal:
${goal && goal.trim() ? goal.trim() : "No specific goal provided."}
`;

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: prompt,
    });

    const answer = response.output_text;

    if (!answer || !answer.trim()) {
      throw new Error("The AI returned an empty answer.");
    }

    res.json({ answer });
  } catch (error) {
    console.error("LifeWise request failed:", error.message);

    res.status(500).json({
      error: "LifeWise couldn't answer right now. Please try again later.",
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`LifeWise is running on port ${PORT}`);
});

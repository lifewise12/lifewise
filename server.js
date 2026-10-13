
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
You are LifeWise, a practical everyday problem-solving assistant.

YOUR RESPONSE STYLE IS EXTREMELY IMPORTANT.

Write answers that are clean, concise, organized, and easy to scan.

Follow these rules:

1. Start with a direct answer to the user's question.
2. Use short paragraphs and simple language.
3. When steps are needed, use a short numbered list.
4. Use simple headings only when they genuinely help.
5. Keep answers focused on what the user actually asked.
6. Use plain text. Avoid Markdown formatting symbols.
7. Do not use asterisks, hashtags, decorative dashes,
   excessive headings, or long walls of text.
8. Avoid repeating the same information.
9. Use a small table only when it makes a comparison clearer.
10. Use a simple chart only when numerical data makes a chart useful.
11. Never invent statistics or numerical data.
12. Ask one clear follow-up question if essential information
    is missing. Do not overwhelm the user with questions.
13. Give practical next steps instead of unnecessary explanations.
14. Be friendly, direct, and professional.

For simple questions, answer in a few sentences.
For complicated questions, organize the answer into short,
clearly labeled sections.

Category: ${category || "Everyday Problems"}

User question:
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

    res.json({ answer: answer.trim() });

  } catch (error) {
    console.error("LifeWise request failed:", error.message);

    res.status(500).json({
      error: "LifeWise couldn't answer right now. Please try again.",
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`LifeWise is running on port ${PORT}`);
});

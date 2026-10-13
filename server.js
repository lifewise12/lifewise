
const express = require("express");
const OpenAI = require("openai");

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: "LifeWise AI has not been connected yet."
      });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      instructions: `
You are LifeWise, a practical everyday problem-solving assistant.

Help people understand, plan, organize, compare, and accomplish
things in their everyday lives.

Turn problems into useful plans, checklists, budgets,
and projects when appropriate.

Give clear, practical steps.
Ask follow-up questions when information is missing.
Be honest about uncertainty.
Recommend qualified professionals when necessary.

Your goal is to help people do life wiser.
      `,
      input: req.body.message
    });

    res.json({
      answer: response.output_text
    });

  } catch (error) {
    console.error("LifeWise request failed:", error.message);

    res.status(500).json({
      error: "LifeWise couldn't answer right now. Please try again."
    });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`LifeWise is running on port ${port}`);
});

          
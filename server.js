const express = require("express");
const OpenAI = require("openai");

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>LifeWise</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #101a2b;
          color: white;
          padding: 25px;
          max-width: 600px;
          margin: auto;
        }
        textarea {
          box-sizing: border-box;
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          font-size: 16px;
        }
        button {
          margin-top: 12px;
          padding: 14px 20px;
          background: #f29b38;
          border: none;
          border-radius: 10px;
          font-weight: bold;
        }
        #answer {
          white-space: pre-wrap;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <h1>LifeWise</h1>
      <p>Your everyday problem-solving assistant.</p>
      <textarea id="question" rows="5"
        placeholder="What can I help you solve?"></textarea>
      <br>
      <button onclick="askLifeWise()">Ask LifeWise</button>
      <p id="answer"></p>
      <script>
        async function askLifeWise() {
          const question = document.getElementById("question").value.trim();
          const answer = document.getElementById("answer");

          if (!question) {
            answer.textContent = "Please enter a question.";
            return;
          }

          answer.textContent = "Thinking...";

          try {
            const response = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: question })
            });
            const data = await response.json();
            answer.textContent =
              data.answer || data.error || "Please try again.";
          } catch (error) {
            answer.textContent = "Connection failed. Please try again.";
          }
        }
      </script>
    </body>
    </html>
  `);
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
      instructions:
        "You are LifeWise, a helpful everyday problem-solving assistant. Give clear, practical steps. Ask follow-up questions when needed. Be honest about uncertainty and recommend qualified professionals for dangerous or specialized problems.",
      input: req.body.message
    });

    res.json({ answer: response.output_text });
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

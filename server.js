import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import { exec } from "child_process";

dotenv.config();
const app = express();
const port = 4000;

app.use(bodyParser.json());

const easyPostProxy = async (req, res) => {
  console.log(req.body, req.method, req.get("content-type"));
  const apiRes = await fetch(`https://api.easypost.com${req.path}`, {
    method: req.method,
    headers: {
      "content-type": "application/json",
      authorization: `Basic ${Buffer.from(
        `${process.env.EASYPOST_API_KEY}:`
      ).toString("base64")}`,
    },
    body: req.method === "GET" ? null : JSON.stringify(req.body),
  });
  res.send(await apiRes.json());
};

app.get("/pibox-print", (req, res) => {
  exec("ls -la", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
});

app.get("*", easyPostProxy);
app.post("*", easyPostProxy);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

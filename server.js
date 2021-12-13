import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import https from "https"; // or 'https' for https:// URLs
import fs from "fs";

import { exec } from "child_process";

dotenv.config();
const app = express();
const port = 4000;

app.use(bodyParser.json());

const easyPostProxy = async (req, res) => {
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

app.post("/pibox/print-label", (req, res) => {
  const file = fs.createWriteStream("label.pdf");
  const request = https.get(req.body.url, function (response) {
    response.pipe(file);
  });
  request.on("finish", () => {
    exec("./bin/print_pdf.sh", (error, stdout, stderr) => {
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
  res.send("");
});

app.get("*", easyPostProxy);
app.post("*", easyPostProxy);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

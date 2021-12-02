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
  const file = fs.createWriteStream("raster-to-tspl-js/test-label.png");
  const request = https.get(req.body.url, function (response) {
    response.pipe(file);
  });
  request.on("end", () => {
    exec(
      "node convert.js",
      {
        cwd: "/root/pibox-shipping/raster-to-tspl-js",
      },
      (error, stdout, stderr) => {}
    );
  });
  res.send("");
});

app.get("*", easyPostProxy);
app.post("*", easyPostProxy);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

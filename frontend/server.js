import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT || 3000);
const distDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "dist");

app.use(express.static(distDirectory));
app.get("*", (_request, response) => {
  response.sendFile(path.join(distDirectory, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Frontend listening on port ${port}`);
});

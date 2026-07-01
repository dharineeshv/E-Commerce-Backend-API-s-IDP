import "./src/config/env.js";
import app from "./src/app.js";

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Order service listening on http://localhost:${PORT}`);
});

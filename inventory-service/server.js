import "./src/config/env.js";
import app from "./src/app.js";

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  console.log(`Inventory Service listening on http://localhost:${PORT}`);
});

import "./src/config/env.js";
import app from "./src/app.js";

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`Payment service listening on http://localhost:${PORT}`);
});

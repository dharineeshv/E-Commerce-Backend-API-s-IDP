import "./src/config/env.js";
import app from "./src/app.js";

const PORT = process.env.PORT || 3006;

app.listen(PORT, () => {
  console.log(`Authentication Service running on port ${PORT}`);
});
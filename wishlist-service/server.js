import "./src/config/env.js";
import app from "./src/app.js";

const PORT = process.env.PORT || 5006;

app.listen(PORT, () => {
  console.log(`Wishlist service listening on http://localhost:${PORT}`);
});

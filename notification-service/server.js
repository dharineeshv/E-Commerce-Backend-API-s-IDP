import dotenv from "dotenv";
import app from "./src/app.js";

dotenv.config();

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
  console.log(`🚀 Notification Service running on port ${PORT}`);
});
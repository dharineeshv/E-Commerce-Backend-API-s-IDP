import dotenv from "dotenv";
import { sendEmail } from "./src/services/emailService.js";

dotenv.config();

try {
  await sendEmail({
    to: process.env.GMAIL_EMAIL,
    subject: "Notification Service Test",
    text: "Congratulations! Your Notification Service can send emails successfully.",
  });

  console.log("Test email sent successfully.");

} catch (error) {
  console.error(error);
}
import transporter from "../config/smtp.js";

const sendEmail = async ({ to, subject, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"E-Commerce Notification" <${process.env.GMAIL_EMAIL}>`,
      to,
      subject,
      text,
    });

    console.log("Email sent successfully.");
    console.log("Message ID:", info.messageId);

    return info;

  } catch (error) {

    console.error("Failed to send email:", error);

    throw error;
  }
};

export { sendEmail };
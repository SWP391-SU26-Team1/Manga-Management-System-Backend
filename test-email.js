require("dotenv").config();
const nodemailer = require("nodemailer");

async function main() {
  const smtpHost = process.env.EMAIL_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.EMAIL_PORT || 587);
  const smtpSecure = process.env.EMAIL_SECURE === "true" || process.env.EMAIL_SECURE === "1";
  const smtpUser = process.env.EMAIL_USER;
  const smtpPass = process.env.EMAIL_PASS;

  console.log("--- Cấu hình Email gửi ---");
  console.log("Host:", smtpHost);
  console.log("Port:", smtpPort);
  console.log("Secure:", smtpSecure);
  console.log("User:", smtpUser);
  console.log("Password:", smtpPass ? "******" : "CHƯA CÓ");

  if (!smtpUser || !smtpPass) {
    console.error("Lỗi: EMAIL_USER hoặc EMAIL_PASS đang bị trống trong file .env!");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    console.log("\nĐang gửi thử email tới:", smtpUser, "...");
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || smtpUser,
      to: smtpUser,
      subject: "Test gửi OTP - Manga Management",
      text: "Xin chào! Đây là email tự động gửi thử nghiệm từ server NodeJS của bạn để kiểm tra cấu hình SMTP (App Password) đã hoạt động chính xác.",
    });

    console.log("✅ Gửi email thành công!");
    console.log("Message ID:", info.messageId);
    console.log("Hãy kiểm tra Hộp thư đến (hoặc thư rác/spam) của email:", smtpUser);
  } catch (error) {
    console.error("❌ Gửi email thất bại!");
    console.error("Chi tiết lỗi:", error);
  }
}

main();

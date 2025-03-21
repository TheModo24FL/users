// Add your JavaScript code here
// document.addEventListener('DOMContentLoaded', function () {
//     console.log('JavaScript is loaded');
// });

const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv").config();

const transporter = nodemailer.createTransport({
  port: process.env.SMTP_PORT,
  host: process.env.SMTP_HOST,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  secure: true,
});

const sendResetEmail = async (email, token) => {
  const resetLink = `${process.env.BASE_URL}/resetPassword/${token}`;
  let emailData = {
    from: process.env.SMTP_USER,
    to: email,
    subject: "Reset password",
    text: `Access this link to reset your password: ${resetLink}`,
  };
  try {
    await transporter.sendMail(emailData);
  } catch (error) {
    console.error("Error while sending reset email.", error);
  }
};
const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        reject(err);
      }
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          reject(err);
        }
        resolve(hash);
      });
    });
  });
};

const comparePasswords = (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePasswords,
  sendResetEmail
};

import nodemailer from "nodemailer";

const HOSTNAME = "thewang.cse356.compas.cs.stonybrook.edu";


const transporter = nodemailer.createTransport({
    host: "130.245.136.123",
    port: 11587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: `donotreply@${HOSTNAME}`,
      pass: "idkyet",
    },
    tls: {
      rejectUnauthorized: false
    }
  });

export function sendEmail(email: string, key: string) {
  const encoded_email = encodeURIComponent(email);
  const encoded_key = encodeURIComponent(key);
  const encoded = `http://${HOSTNAME}/verify?email=${encoded_email}&key=${encoded_key}`;
    const mailOptions = {
        from: `donotreply@${HOSTNAME}`,
        to: email,
        subject: "Verification Link",
        text: encoded,
    };
    console.log("MAIL OPTIONS: ",mailOptions);
    transporter.sendMail(mailOptions,function (error:any, info:any) {
      if (error) {
        console.log('Error:', error);
      } else {
        console.log('Email sent: ' + info.response);
      }});
}
import nodemailer from "nodemailer";

// create email Transport
const transporter = nodemailer.createTransport({
 service: "gmail",
  secure: false, // true for 465, false for other ports
  auth: {
    user: "arebkhn6@gmail.com",
    pass: "kmdgrdnbzvfukobi",
  },
});

export default transporter;

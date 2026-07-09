import nodemailer from 'nodemailer';
import config from '../../config.json';

export default async function sendEmail({ to, subject, html, from = config.emailFrom }: any) {
    console.log('\n--- ✉️ SIMULATED EMAIL OUTBOUND ---');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    \n${html.replace(/<[^>]*>/g, ' ').trim()}`); // Strip HTML tags for clean console display
    console.log('-----------------------------------\n');

    try {
        const transporter = nodemailer.createTransport(config.smtpOptions);
        await transporter.sendMail({ from, to, subject, html });
        console.log(`✉️ Email successfully delivered to ${to} via SMTP`);
    } catch (err: any) {
        console.warn(`⚠️ SMTP delivery failed, but proceeding via local console logs: ${err.message || err}`);
    }
}

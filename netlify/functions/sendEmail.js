const axios = require('axios');
const sgMail = require('@sendgrid/mail');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { email, message, recaptcha } = JSON.parse(event.body);

    // Verify reCAPTCHA v3
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY; // Set this in Netlify environment variables
    try {
        const recaptchaResponse = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptcha}`);
        if (!recaptchaResponse.data.success || recaptchaResponse.data.score < 0.5) { // Adjust score threshold as needed
            return { statusCode: 500, body: 'reCAPTCHA verification failed' };
        }
    } catch (error) {
        return { statusCode: 500, body: 'Error verifying reCAPTCHA' };
    }

    // SendGrid setup
    sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Set in Netlify environment variables

    const msg = {
        to: email, // Change to your recipient
        from: process.env.SENDGRID_SENDER_EMAIL, // Change to your verified sender
        subject: 'Message from Astro Forum',
        text: message,
        // html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    };

    try {
        await sgMail.send(msg);
        return { statusCode: 200, body: JSON.stringify({ message: 'Email sent successfully' }) };
    } catch (error) {
        console.error(error);

        if (error.response) {
            console.error(error.response.body)
        }

        return { statusCode: 500, body: JSON.stringify({ message: 'Error sending email' }) };
    }
};

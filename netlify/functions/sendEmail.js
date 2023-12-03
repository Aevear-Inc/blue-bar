const axios = require('axios');
const sgMail = require('@sendgrid/mail');

exports.handler = async function(event, context){
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { email, message, recaptcha } = JSON.parse(event.body);

  // Verify reCAPTCHA
  const recaptchaSecret = Netlify.env.RECAPTCHA_SECRET_KEY;
  try {
    const recaptchaResponse = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptcha}`);
    if (!recaptchaResponse.data.success || recaptchaResponse.data.score < 0.5) {
      return { statusCode: 500, body: 'reCAPTCHA verification failed' };
    }
  } catch (error) {
    return { statusCode: 500, body: 'Error verifying reCAPTCHA' };
  }

  // SendGrid setup
  sgMail.setApiKey(Netlify.env.SENDGRID_API_KEY);

  const msg = {
    to: email,
    from: Netlify.env.SENDGRID_SENDER_EMAIL,
    subject: 'Message from Astro Forum',
    text: message,
  };

  try {
    await sgMail.send(msg);
    return { statusCode: 200, body: JSON.stringify({ message: 'Email sent successfully' }) };
  } catch (error) {
    console.error(error);
    if (error.response) {
      console.error(error.response.body);
    }
    return { statusCode: 500, body: JSON.stringify({ message: 'Error sending email' }) };
  }
};

const axios = require('axios');
const sgMail = require('@sendgrid/mail');

exports.handler = async function(event, context){
    console.log('Request body:', event.body);

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
try {
  data = JSON.parse(event.body);
} catch (error) {
  console.error('Error parsing JSON:', error);
  return { statusCode: 400, body: 'Cannot parse request body' };
}

const { email, message, recaptcha } = data;

  // Verify reCAPTCHA
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
  try {
    const recaptchaResponse = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptcha}`);
    if (!recaptchaResponse.data.success || recaptchaResponse.data.score < 0.5) {
      return { statusCode: 500, body: 'reCAPTCHA verification failed' };
    }
  } catch (error) {
    return { statusCode: 500, body: 'Error verifying reCAPTCHA' };
  }

  // SendGrid setup
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: email,
    from: process.env.SENDGRID_SENDER_EMAIL,
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

const Sib = require('sib-api-v3-sdk', { resolve: '../sib-api-v3-sdk' });
const dotenv = require('dotenv');
dotenv.config({ path: './util/.env' });
const client = Sib.ApiClient.instance
const apiKey = client.authentications['api-key'];

apiKey.apiKey = process.env.API_KEY

const tranEmailApi = new Sib.TransactionalEmailsApi()

const sender = {
    email: 'nishimishra180500@gmail.com',
    name: 'Day-to-Day Expense App'
}

const sendForgotPasswordEmail = (email, name, forgotPasswordRequestId) => {
    const receivers = [
      {
        email,
        name,
      },
    ];
  
    tranEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject: 'Password Reset Link',
      textContent: `
          Hello ${name},
          Please use the following link to reset your password:
          http://localhost:3000/reset-password/${forgotPasswordRequestId}
      `,
    })
    .then((response) => {
      console.log('Email sent:', response);
    })
    .catch((error) => {
      console.error('Error sending email:', error);
    });
  };

  module.exports = { sendForgotPasswordEmail };
  

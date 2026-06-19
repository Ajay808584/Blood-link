const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'venkateshjalapur@gmail.com',
        pass: 'slhy llqg rthq hurn'
    }
});

module.exports = transporter;
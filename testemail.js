const transporter = require('./emailService');

transporter.sendMail(
{
    from: 'venkateshjalapur@gmail.com',
    to: 'venkateshjalapur@gmail.com',
    subject: 'BloodLink Test Email',
    text: 'Congratulations! Email notifications are working.'
},
(err, info) => {

    if(err){
        console.log("Error:", err);
    }
    else{
        console.log("Email Sent Successfully");
    }

});
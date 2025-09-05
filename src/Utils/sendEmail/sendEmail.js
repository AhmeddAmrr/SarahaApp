import nodemailer from 'nodemailer';

export const sendEmail = ({to , subject, html}) => {

    const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 465,
        secure: true, 
        service: "gmail",
        auth: {
            user: process.env.EMAIL, 
            pass: process.env.EMAIL_PASSWORD, 
        },
    });


    const main = async () =>{
        const info = await transporter.sendMail({
            from:`"sarahaApp" <${process.env.EMAIL}>`, 
            to ,
            subject,
            html
        }); 
        
    }
    main().catch((error) => {
        console.error("Error sending email:", error);
    });
}
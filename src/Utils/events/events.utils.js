import EventEmitter from 'events';
import { sendEmail } from '../sendEmail/sendEmail.js';
import { template } from '../sendEmail/generateHTML.js';

export const emailEvents = new EventEmitter();

emailEvents.on('confirmEmail'  ,async(data)=>{
    await sendEmail( {
        to: data.to ,
        subject: data.subject ,
          html: template(data.otp , data.name , 'Confirm Email' , "Thanks for signing up! Use the verification code below to confirm your email address")
            
});
    
}  
);

emailEvents.on('forgetPassword'  ,async(data)=>{
    await sendEmail({
         to: data.to ,
         subject: data.subject ,
           html : template(data.otp , data.name , 'Forget Password' , "You requested to reset your password. Use the verification code below to reset it")
});
        });

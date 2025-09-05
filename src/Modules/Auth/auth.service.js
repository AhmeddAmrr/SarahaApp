import UserModel, { providers  } from '../../DB/Models/User.model.js';
import { successResponse } from '../../Utils/successResponse.utils.js';
import * as dbService from '../../DB/dbService.js';
import { hash, compare } from '../../Utils/hashing/hash.utils.js';
import { encrypt } from '../../Utils/encryption/encryption.utils.js';
import { getNewLoginCredentials, logOutEnums } from '../../Utils/token/token.utils.js';
import {customAlphabet} from 'nanoid';
import  { OAuth2Client }  from 'google-auth-library';
import { emailEvents } from '../../Utils/events/events.utils.js';
import TokenModel from '../../DB/Models/token.model.js';






export const signup = async (req, res, next) => {
    
        const { firstName, lastName, email, password , confirmPassword ,gender , phone,role } = req.body;


        const existingUser = await dbService.findOne({ model: UserModel,filter: { email },});

        if (existingUser) 
            return next(new Error('User already exists with this email', { cause: 409 }) );

        const hashedPassword = await hash({ plainText: password, saltRound: 12 });
        const encryptedPhone =  await encrypt({ plainText: phone });

        const otp = customAlphabet('0123456789', 6)();
        const otpExpiration = Date.now() + 5 * 60 * 1000; 

       const user  = await dbService.create({
            model: UserModel,
            data: [
            {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            gender,
            phone:encryptedPhone,
            role: role,
            confirmEmailOtp: await hash(otp,12),
            confirmEmailOtpExpiration: otpExpiration
            
        }
    ],   
     });
     emailEvents.emit('confirmEmail' , { to: email , subject: 'Confirm your email' , otp , name:firstName } )  ;
     
        return successResponse({ res , statusCode: 201 , message: 'User created successfully' , data: user });

    
};
export const login = async (req, res, next) => {
    
        const { email, password } = req.body;

        const user = await dbService.findOne({ model: UserModel,filter: { email }});
        if (!user) return next(new Error('User Not Found' , { cause: 404 }));
        if(!user.confirmEmail) return next(new Error('Please confirm your email', { cause: 403 }));


        if (! await compare({ plainText: password, hash: user.password }))
             return next(new Error('Invalid Password', { cause: 401 }));

        const newCredentials = await getNewLoginCredentials(user);

        

        return successResponse({ res , statusCode: 200 , message: 'User logged in successfully' , data: {newCredentials}   });
    
    
};

export const logout = async (req, res, next) => {
    const { flag } = req.body;

    let status = 200;
    switch (flag) {
        case logOutEnums.logoutFromAlllDevices:
            await dbService.updateOne({
                model: UserModel,
                filter: { _id: req.user._id },
                data: { changeCredentialsTime: Date.now() }
            });
            break;
        case logOutEnums.logoutFromCurrentDevice:
             await dbService.create({
            model:TokenModel,
            data:[{
            jti: req.decodedToken.jti,
            userId: req.user._id,
            expiresIn: Date.now() -  req.decodedToken.exp,
        }]
    });
    status = 201;
    break;
    }

   
    return successResponse({ res, statusCode: status, message: 'User Logged out successfully' });
    
    
};

export const confirmEmail = async (req, res, next) => {
    const { email , sentOtp } = req.body;

    const user = await dbService.findOne({ model: UserModel, filter: { email,
        confirmEmail:{ $exists: false },
        confirmEmailOtp:{$exists:true},
        deletedAt: { $exists: false },   
     } });
    if (!user) return next(new Error('User Not Found ', { cause: 404 }));
    if (user.confirmEmailOtpExpiration < Date.now()) {
        return next(new Error('OTP Expired but you can resend the code ', { cause: 400 }));
    }

    if (!await compare({ plainText: sentOtp, hash: user.confirmEmailOtp })) {
        return next(new Error('Invalid OTP', { cause: 401 }));
    }

    await dbService.updateOne({
        model:UserModel,
        filter:{email},
        data:{
            confirmEmail: Date.now(),
            $unset: { confirmEmailOtp :  true},
            $inc: { __v : 1 }
        }
    })
    return successResponse({ res, statusCode: 200, message: 'Email confirmed successfully' });
}

async function verifyGoogleToken(token) {
    const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT_ID,  
  });
  const payload = ticket.getPayload();
    return payload;
}

export const loginWithGmail = async (req, res, next) => {
    const { idToken } = req.body;
    const {email ,given_name, family_name , email_verified , picture } = await verifyGoogleToken(idToken);

    if (!email_verified) {
        return next(new Error('Email not verified', { cause: 403 }));
    }
    const user = await dbService.findOne({ model: UserModel, filter: { email } });
    if (user) {
        if (user.provider === providers.google) {
        const newCredentials = await getNewLoginCredentials(user);   

        return successResponse({ res , statusCode: 200 , message: 'User logged in successfully' , data: {newCredentials}   });
    }
    }
    const newUser = await dbService.create({
        model: UserModel,
        data: [{
            firstName: given_name,
            lastName: family_name,
            photo: picture,
            provider: providers.google,
            email,
            confirmEmail: Date.now(),
        }
        ],
    });
         
    const newCredentials = await getNewLoginCredentials(user);

    return successResponse({ res , statusCode: 201 , message: 'User created successfully' , data: {newCredentials}   });

};

    
export const refreshToken = async (req, res, next) => {
    const user = req.user;

    const newCredentials = await getNewLoginCredentials(user);

        return successResponse({ res , statusCode: 200 , message: 'New Credentials created successfully' , data: {newCredentials}   });

}

export const forgetPassword = async (req , res, next) =>{
    const { email } = req.body;
    const otp = await customAlphabet("0123456789", 6)();
    const hashedOtp = await hash({ plainText: otp});
    const user = await dbService.findOneAndUpdate({
        model: UserModel,
        filter: { 
            email,
            provider: providers.system,
            confirmEmail:{ $exists: true},
            deletedAt: { $exists: false },
        },
        data: { 
            forgetPasswordOtp: hashedOtp,
            forgetPasswordOtpExpiration: Date.now() + 5 * 60 * 1000 
        }
    })
    if (!user) return next(new Error('User Not Found', { cause: 404 }));
    emailEvents.emit('forgetPassword' , { to: email , subject: 'Reset your password' , otp , name:user.firstName } )  ;
    return successResponse({ res, statusCode: 200, message: 'OTP sent to your email // Check your inbox' });

}

export const resetPassword = async (req , res, next) =>{
    const { email  , otp , password} = req.body;
    
    const user = await dbService.findOne({
        model: UserModel,
        filter: { 
            email,
            provider: providers.system,
            confirmEmail:{ $exists: true},
            deletedAt: { $exists: false },
            forgetPasswordOtp: { $exists: true },
        }
    });

    if (!user) return next(new Error('Invalid Account', { cause: 404 }));

    if (!await compare({ plainText: otp, hash: user.forgetPasswordOtp })) {
        return next(new Error('Invalid OTP', { cause: 400 }));
    }
    if (user.forgetPasswordOtpExpiration < Date.now()) {
        return next(new Error('OTP Expired but you can resend the code', { cause: 400 }));
    }
    
    const hashedPassword = await hash({ plainText: password});
    await dbService.updateOne({
        model: UserModel,
        filter: { email },
        data: {
            password: hashedPassword,
            $unset: { forgetPasswordOtp: true },
            $inc: { __v: 1 }
        }
    });



    return successResponse({ res, statusCode: 200, message: 'Password Reset Successfully' });

}




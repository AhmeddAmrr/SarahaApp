import jwt from 'jsonwebtoken';
import { roles } from '../../DB/Models/User.model.js';
import { nanoid } from 'nanoid';


export const logOutEnums = {
    logoutFromAlllDevices: 'logoutFromAllDevices',
    logoutFromCurrentDevice: 'logoutFromCurrentDevice',
    stayLoggedIn: 'stayLoggedIn',
}


export const signToken = ({payload = {} , signature  , options = {
    expiresIn: '1d',
}}
) => {
    return jwt.sign(payload, signature, options);
}

export const verifyToken = ({token="" , signature }) => {
    return jwt.verify(token, signature);
}

export const getSignature = async ({signatureLevel = "User"}) => {

    let signature = { accessSignature: undefined , refreshSignature: undefined };
    switch (signatureLevel) {
        case 'Admin':
            signature.accessSignature = process.env.ACCESS_ADMIN_SIGNATURE_TOKEN;
            signature.refreshSignature = process.env.REFRESH_ADMIN_SIGNATURE_TOKEN;
            break;
        case 'User':
            signature.accessSignature = process.env.ACCESS_USER_SIGNATURE_TOKEN;
            signature.refreshSignature = process.env.REFRESH_USER_SIGNATURE_TOKEN;
            break;
        default:
            return next(new Error('Invalid signature level', { cause: 401 }));
    }
    return signature;
}

export const getNewLoginCredentials = async (user ) => {
     let signature = await getSignature({ signatureLevel: user.role !== roles.admin ? 'User' : 'Admin' });

    const jwtid = nanoid();

    
            const accessToken = signToken({
                payload: { _id: user._id },
                signature: signature.accessSignature,
                options: {
                    issuer: 'SarahaApp',
                    subject: "Authentication",
                    expiresIn: '1d',
                    jwtid,
             }
            });
            const refreshToken = signToken({
                payload: { _id: user._id },
                signature: signature.refreshSignature,
                options: {
                    issuer: 'SarahaApp',
                    subject: "Authentication",
                    expiresIn: '7d',
                    jwtid,
             }
            });
            return {
                accessToken,
                refreshToken,
                
            }
    
}
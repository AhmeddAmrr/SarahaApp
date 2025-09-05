import { verifyToken } from "../Utils/token/token.utils.js";
import * as dbService from '../DB/dbService.js';
import UserModel from '../DB/Models/User.model.js';
import { getSignature } from "../Utils/token/token.utils.js";
import TokenModel from "../DB/Models/token.model.js";

export const tokenTypeEnum = {
    access: 'access',
    refresh: 'refresh',
}


const decodeToken = async ({authorization ,tokenType = tokenTypeEnum.access  ,next })=> {

    const [bearer,token] = authorization.split(' ') || [];
    if (!token || !bearer)
        return next(new Error('Invalid Token', { cause: 401 }));

    const signature = await getSignature({signatureLevel:bearer });
    


    const decodedToken = verifyToken({ token:token , signature: tokenType === tokenTypeEnum.access ? signature.accessSignature : signature.refreshSignature });

    if(decodedToken.jti && await dbService.findOne({
        model: TokenModel,
        filter: { jti : decodedToken.jti },
    }
    ))
        return next(new Error('Token is revoked', { cause: 401 }));
    
    
    const user = await dbService.findById({
        model: UserModel,
        id : {_id: decodedToken._id},
    });
    if (!user) return next(new Error('User Not Found', { cause: 404 }));
     
    if(user.changeCredentialsTime?.getTime() > decodedToken.iat * 1000)
        return next (new Error (" token is expired" , {cause:401}));

    
    return {user , decodedToken};
    
    
}


export const authentication = ({tokenType = tokenTypeEnum.access}) => {
    return async (req, res, next) => {
        const {user , decodedToken} = await decodeToken({ authorization: req.headers.authorization, tokenType, next }) || {};
        req.user = user;
        req.decodedToken = decodedToken;
        return next();
    }

}


export const authorization = ({ accessRoles = []}) =>{
    return async (req, res, next) => {
        if (!accessRoles.includes(req.user.role))
            return next(new Error('Unauthorized', { cause: 403 }));
        return next();
    }
    }
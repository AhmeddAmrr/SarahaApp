import { decrypt, encrypt } from '../../Utils/encryption/encryption.utils.js';
import { successResponse } from '../../Utils/successResponse.utils.js';
import * as dbService from "../../DB/dbService.js";
import  UserModel, { roles }  from "../../DB/Models/User.model.js";
import { compare, hash } from '../../Utils/hashing/hash.utils.js';
import { logOutEnums } from '../../Utils/token/token.utils.js';
import TokenModel from '../../DB/Models/token.model.js';
import { cloudinaryConfig } from '../../Utils/multer/cloudinary.js';
import { destroyCloudFile, uploadCloudFile } from '../../Utils/multer/cloud.multer.js';

export const getSingleUser = async (req, res, next) => {

    req.user.phone = decrypt( {cipherText: req.user.phone} );

    const user = await dbService.findById({
        model: UserModel,
        id: req.user._id,
        populate: [{
            path: "messages",
        }]

    })

    return successResponse({ res, statusCode: 200, message: 'User retrieved successfully', data: {user} });
};

export const shareProfile = async (req , res, next) =>{
    const {userId} = req.params;
    const user  = await dbService.findOne({
        model:UserModel,
        filter: {_id:userId , confirmEmail:{ $exists :  true }}
    })
    return user 
    ? successResponse({ res, statusCode: 200, message: 'User retrieved successfully', data: { user } }) : next(new Error ("Invalid or Not Verified Account " , {cause:404}));
};

export const updateProfile = async (req , res, next) =>{
    if(req.body.phone){
        req.body.phone = await encrypt(req.body.phone);
    }

    const updatedUser  = await dbService.findOneAndUpdate({
        model:UserModel,
        filter: {_id: req.user._id},
        data: req.body,
    })
    return updatedUser 
    ? successResponse({ res, statusCode: 200, message: 'User retrieved successfully', data: { updatedUser } }) : next(new Error ("Invalid Account " , {cause:404}));
};

export const freezeAccount = async (req , res, next) =>{
    const {userId} = req.params;
    if(userId && req.user.role !== roles.admin)
        return next(new Error("You are not authorized to freeze this account" ,  { cause:403 } )
    ); 
    const updatedUser = await dbService.findOneAndUpdate({
        model:UserModel,
        filter:{_id:userId || req.user._id , deletedAt: {$exists: false}},
        data:{
            deletedAt:Date.now(),
            deletedBy: req.user._id,
            $unset:{
                restoredAt:true,
                restoredBy:true,
            }
        },


    })


    return updatedUser 
    ? successResponse({ res, statusCode: 200, message: 'User frozen successfully', data: { updatedUser } }) : next(new Error ("Invalid Account " , {cause:404}));
};

export const restoreAccount = async (req , res, next) =>{
    const {userId} = req.params;
    

    const updatedUser = await dbService.findOneAndUpdate({
        model:UserModel,
        filter:{
            _id:userId,
            deletedAt:{$exists :true},
            deletedBy : {$ne: userId}
        },
        data:{
            $unset : {
                deletedAt : true,
                deletedBy: true,
            },
            restoredAt:Date.now(),
            restoredBy:req.user._id,
        }
    })
        return updatedUser 
    ? successResponse({ res, statusCode: 200, message: 'User restored successfully', data: { updatedUser } }) : next(new Error ("Invalid Account " , {cause:404}));
};

export const restoreAccountByUser = async (req , res, next) =>{
    const updatedUser = await dbService.findOneAndUpdate({
        model: UserModel,
        filter: {
            _id: req.user._id,
            deletedAt: { $exists: true },
            deletedBy: req.user._id 
        },
        data: {
            $unset : {
                deletedAt : true,
                deletedBy: true,
            },
            restoredAt: Date.now(),
            restoredBy: req.user._id,
        }
    });

    return updatedUser 
        ? successResponse({ res, statusCode: 200, message: 'Account restored successfully (by user)', data: { updatedUser } }) 
        : next(new Error("You cannot restore this account", { cause:403 }));
};

export const hardDeleteAccount = async (req , res, next) =>{
    const {userId} = req.params;
    
      const user = await dbService.deleteOne({
        model:UserModel,
        filter:{
            _id: userId,
            deletedAt:{$exists :true},
        },
      })
   
        return user.deletedCount 
    ? successResponse({ res, statusCode: 200, message: 'User deleted successfully'}) : next(new Error ("Invalid Account " , {cause:404}));
};

export const updatePassword = async (req , res, next) =>{
    const {oldPassword , password , flag} = req.body;

    if(!await compare ({plainText: oldPassword , hash : req.user.password}))
        return next(new Error("old password is incorrect" ,  { cause:400 } ))
    
    let updatedData = {};
    switch (flag) {
        case logOutEnums.logoutFromAlllDevices:
            updatedData.changeCredentialsTime = Date.now();
            break;
        case logOutEnums.logoutFromCurrentDevice:
            await dbService.create({
                model:TokenModel,
                data:[{
                jti: req.decodedToken.jti,
                userId: req.user._id,
                expiresIn: Date.now() -  req.decodedToken.exp,
            }]
            })
        case logOutEnums.stayLoggedIn:
            break;
    }
            

    if(oldPassword === password)
        return next(new Error("new password must be different than old password" ,  { cause:400 } ))

    const user = await dbService.findOneAndUpdate({
        model:UserModel,
        filter:{
            _id: req.user._id,
            
        },
        data :{
            password:await hash({plainText: password  }),
            ...updatedData
        }
      }) 

   
        return user 
    ? successResponse({ res, statusCode: 200, message: 'password updated successfully' , data  : { user } }) : next(new Error ("Invalid data " , {cause:404}));
};

export const updateProfileImage = async (req , res, next) =>{

    if(req.user.profileCloudImage?.public_id){
            await destroyCloudFile(req.user.profileCloudImage.public_id);
        }
    
    const  {public_id , secure_url} = await uploadCloudFile(req , "profile" , next);

    const user = await dbService.findOneAndUpdate({
        model:UserModel,
        filter:{_id:req.user._id},
        data:{
            profileCloudImage: { public_id , secure_url }, 
        }
    });
    
   
        return  successResponse({ res, statusCode: 200, message: 'profile image updated successfully' , data  : {user } })
};

export const coverImages = async (req , res, next) =>{



    if(req.user.coverCloudImages?.length){
        for (const img of req.user.coverCloudImages) {
            await destroyCloudFile(img.public_id);
        }
    }
    const urls = await uploadCloudFile(req , "cover" , next);


    const user = await dbService.findOneAndUpdate({
      model: UserModel,
      filter: { _id: req.user._id },
      data: { coverCloudImages:  urls },
    });

   
        return  successResponse({ res, statusCode: 200, message: 'cover images updated successfully' , data  : {user } })
};


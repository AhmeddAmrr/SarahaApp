import joi from "joi";
import { Types } from "mongoose";

export const generalFields = {
        firstName: joi.string().min(3).max(20),
        lastName: joi.string().min(3).max(20),
        email: joi
        .string()
        .email({minDomainSegments:2 ,
             maxDomainSegments: 5 ,
              tlds: {allow: ["com" , "net" ,"edu" , "gov" , "io" , "org" ]},
            }),
        
        password: joi.string().pattern(/^[A-Za-z\d@#$!?&*]{8,20}/),
        confirmPassword: joi.ref('password'),
        gender: joi.string().valid("male" , "female").default("male"),
        role: joi.string().valid("USER" , "ADMIN").default("USER"),
        phone: joi.string().pattern(/^(002|\+2)?01[0125]\d{8}$/),
        id:joi.string().custom((value , helper) =>{
            return (
                Types.ObjectId.isValid(value) || helper.message("Invalid ObjectId Formaat")
            );
        }),
        otp:joi.string().pattern(/^\d{6}/),
        file: {
            fieldname: joi.string(),
            originalname: joi.string(),
            encoding: joi.string(),
            mimetype: joi.string(),
            size: joi.number().positive(),
            path : joi.string(),
            filename: joi.string(),
            finalPath: joi.string(),
            destination: joi.string(),
        },
};





export const validation = (schema) => {
    return (req, res, next) => {
        const validationErrors = [];
        for (const key of Object.keys(schema)) {
            const validationResult=schema[key].validate(req[key] , {
                abortEarly:false
            })
           if (validationResult.error) {
            validationErrors.push({key , details: validationResult.error.details });
        } 
        }
        if(validationErrors.length)
            return res.status(400).json({error:"Validation Error" , details:validationErrors })
        
        return next();

    }
}




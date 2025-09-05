import * as dbService from "../../DB/dbService.js";
import  UserModel  from "../../DB/Models/User.model.js";
import { cloudinaryConfig } from "../../Utils/multer/cloudinary.js";
import MessageModel from "../../DB/Models/Message.model.js";
import {successResponse} from "../../Utils/successResponse.utils.js";

export const sendMessage = async (req, res, next) => {
    const { recieverId } = req.params;
    const { content } = req.body;

    if(! await dbService.findOne({
        model: UserModel,
        filter:{
            _id: recieverId,
            deletedAt: {$exists: false},
            confirmEmail: { $exists: true },
        }

    }))

    return next(new Error("Reciever not found" , { cause: 404 }));
    const attachments = [];
    if(req.files){
        for(const file of req.files){
            const { secure_url , public_id } = await cloudinaryConfig().uploader.upload(file.path , { 
                folder: `Saraha-App/Messages/${recieverId}`,
            });
            attachments.push({ secure_url , public_id });
        }
    }
    const message = await dbService.create({
        model:MessageModel,
        data:[{
            content,
            attachments,
            recieverId,
            senderId: req.user?._id,
        }]
});
     return successResponse({
        res,
        statusCode: 201,
        message: "Message sent successfully",
        data: { message},
     })
};

export const getMessages = async (req, res, next) => {
    const { userId } = req.params;

    const messages = await dbService.find({
        model:MessageModel,
        filter:{
            recieverId: userId,
        },
        populate: [{
            path: "recieverId",
            select: "email gender firstName lastName"
        }]
    })
     return successResponse({
        res,
        statusCode: 201,
        message: "Messages retrieved successfully",
        data: { messages},
     })
};

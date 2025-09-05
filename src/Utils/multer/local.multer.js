import multer from "multer"
import path from "node:path"
import fs from "fs"


export const fileValidation  = {
    images : ["image/png","image/jpg","image/jpeg"],
    videos: ["video/mp4","video/mkv"],
    audios: ["audio/mpeg","audio/wav" , "audio/mp3"],
    documents: ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
}

export const localFileUpload = ({
    customPath = "general",
    validation = [],
}) => {
    let basePath = `uploads/${customPath}`;


    const storage = multer.diskStorage({
        destination:(req,file , cb) =>{
            if(req.user?._id) basePath += `/${req.user._id}`;
            const fullPath = path.resolve(`./src/${basePath}`);
            if(!fs.existsSync(fullPath))
                fs.mkdirSync(fullPath , { recursive : true });

            cb(null ,path.resolve(fullPath) );
        },
        filename:(req,file,cb) => {
            const uniqueFileName = Date.now() + "__" + Math.random() + "__" + file.originalname; 
            file.finalPath = `${basePath}/${uniqueFileName}`;
            cb(null , uniqueFileName);

        }
    });

    const fileFilter = (req,file,cb) => {
        if(validation.includes(file.mimetype))
            cb(null , true);
        else 
            cb(new Error("Invalid file type" , {cause:400}), false);
    };

    return multer({
        fileFilter,
        storage,
    });
}

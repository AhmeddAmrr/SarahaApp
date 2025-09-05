import multer from "multer"
import { cloudinaryConfig } from "./cloudinary.js";




export const cloudFileUpload = ({
    validation = [],
}) => {


    const storage = multer.diskStorage({});

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

export const uploadCloudFile = async (req, flag , next) => {
  let files = [];
  let folder = "";

  if (flag === "profile") {
    files = [req.file]; 
    folder = `Saraha-App/Users/${req.user._id}/profile`;
  } 
  else if (flag === "cover") {
    files = req.files; 
    folder = `Saraha-App/Users/${req.user._id}/covers`;
  } 
  
  else 
    return next(new Error("Invalid flag provided", { cause: 400 }));
  

  const results = [];

  for (const file of files) {
    const { secure_url, public_id } = await cloudinaryConfig().uploader.upload(
      file.path,
      { folder }
    );
    results.push({ secure_url, public_id });
  }

  return flag === "profile" ? results[0] : results;
};


export const destroyCloudFile = async (public_id) =>{
    await cloudinaryConfig().uploader.destroy(public_id);
}
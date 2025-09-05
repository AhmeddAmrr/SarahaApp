import { Router } from "express";
import * as userService from './user.service.js';
import { authentication, authorization, tokenTypeEnum } from "../../Middlewares/authentication.middleware.js";
import { endPoints } from "./user.authorization.js";
import {validation} from "../../Middlewares/validation.middleware.js"
import { coverImagesValidation, freezeAccountValidation, hardDeleteValidation, profileImageValidation, restoreAccountValidation, shareProfileValidation, updatePasswordValidation, updateProfileValidation } from "./user.validation.js";
import { fileValidation, localFileUpload } from "../../Utils/multer/local.multer.js";
import { cloudFileUpload } from "../../Utils/multer/cloud.multer.js";

const router = Router();

router.get('/getSingleUser',authentication({tokenType:tokenTypeEnum.access}), authorization({ accessRoles: endPoints.getSingleUser }) ,userService.getSingleUser);
router.get('/share-profile/:userId',validation(shareProfileValidation) , userService.shareProfile)
router.patch('/update-profile',
    validation(updateProfileValidation) ,
    authentication({tokenType:tokenTypeEnum.access}),
    authorization({ accessRoles: endPoints.updateProfile }),
     userService.updateProfile )

router.delete("{/:userId}/freeze-account" ,
     validation(freezeAccountValidation),
     authentication({tokenType:tokenTypeEnum.access}),
     authorization({ accessRoles: endPoints.freezeAccount }),
     userService.freezeAccount 
)

router.patch("/:userId/restore-account" ,
     validation(restoreAccountValidation),
      authentication({tokenType: tokenTypeEnum.access}),
      authorization({accessRoles:endPoints.restoreAccount}),
      userService.restoreAccount
)

router.patch("/restore-account" ,
     validation(restoreAccountValidation),
      authentication({tokenType: tokenTypeEnum.access}),
      authorization({accessRoles:endPoints.restoreAccountByUser}),
      userService.restoreAccountByUser
)


router.delete("/:userId/hard-delete",
     validation(hardDeleteValidation),
     authentication({tokenType: tokenTypeEnum.access}),
     authorization({accessRoles:endPoints.deleteHardAccount}),
     userService.hardDeleteAccount
     )

router.patch("/update-password",
     validation(updatePasswordValidation),
     authentication({tokenType: tokenTypeEnum.access}),
     authorization({accessRoles:endPoints.updatePassword}),
     userService.updatePassword
     )

router.patch("/profile-image",
     
     authentication({tokenType: tokenTypeEnum.access}),
     // localFileUpload({customPath:"User" , validation: [...fileValidation.images]}).single("profileImage"),
     // validation(profileImageValidation),
     cloudFileUpload({validation: [...fileValidation.images]}).single("profileImage"),
     userService.updateProfileImage
     )

router.patch("/cover-image",
     
     authentication({tokenType: tokenTypeEnum.access}),
     // localFileUpload({customPath:"User" , validation: [...fileValidation.images]}).array("images" , 5),
     // validation(coverImagesValidation),
     cloudFileUpload({validation: [...fileValidation.images]}).array("images" , 5),
     userService.coverImages
     )



export default router;
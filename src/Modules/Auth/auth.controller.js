import { Router } from "express";
import * as authService from './auth.service.js';
import { authentication, tokenTypeEnum } from "../../Middlewares/authentication.middleware.js";
import { confirmEmailValidation, forgetPasswordValidation, loginValidation, logoutValidation, refreshTokenValidation, resetPasswordValidation, signUpValidation, socialLoginValidation } from "./auth.validation.js";
import { validation } from "../../Middlewares/validation.middleware.js";

const router = Router();

router.post('/signup' ,validation(signUpValidation) , authService.signup);
router.post('/login' ,validation(loginValidation), authService.login);
router.post('/logout' ,validation(logoutValidation), authentication({tokenType:tokenTypeEnum.access}),authService.logout);
router.post('/confirmEmail', validation(confirmEmailValidation),authService.confirmEmail);
router.post('/social-login',validation(socialLoginValidation) ,authService.loginWithGmail);
router.get('/refresh-token',validation(refreshTokenValidation),authentication({tokenType:tokenTypeEnum.refresh}) ,authService.refreshToken);
router.patch("/forget-password", validation(forgetPasswordValidation),   authService.forgetPassword);
router.patch("/reset-password", validation(resetPasswordValidation),   authService.resetPassword);


export default router;
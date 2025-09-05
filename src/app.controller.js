import connectionDB from './DB/connection.js';
import authRouter from './Modules/Auth/auth.controller.js';
import messageRouter from './Modules/Message/message.controller.js';
import userRouter from './Modules/User/user.controller.js';
import { globalErrorHandler } from './Utils/errorHandling.utils.js';
import cors from 'cors';
import path from 'path';
import { attachRoutingWithLogger } from './Utils/logger/logger.js';
import { corsOptions } from './Utils/cors/cors.js';
import helmet from 'helmet';
import { limiter } from './Utils/express-rate-limit.js';

const bootstrap = async (app, express) => {
    app.use(express.json());
    app.use(helmet());
    app.use(cors(corsOptions()));
    app.use(limiter);

    await connectionDB();

    attachRoutingWithLogger(app ,'/api/auth' , authRouter , "auth.log"); 
    attachRoutingWithLogger(app ,'/api/user' , userRouter , "user.log"); 

    app.get('/' , (req , res) => {
        return res.status(200).json({message: "Welcome to Saraha App"});
    });
    app.use("/uploads" , express.static(path.resolve("./src/uploads")))
    app.use('/api/auth', authRouter);
    app.use('/api/message', messageRouter);
    app.use('/api/user', userRouter);

    app.all('/*dummy',(req , res , next) => {
        return next(new Error('Not Found Handler' , {
            cause: 404,
        })); 
    });


    app.use(globalErrorHandler);
}

export default bootstrap;
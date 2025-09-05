import express from 'express';
import  bootstrap  from './app.controller.js';
import dotenv from 'dotenv';
import chalk from 'chalk';


const app = express()
dotenv.config({path: "./src/config/.env"});
const port = process.env.PORT ;

await bootstrap(app , express);

app.listen(port, () => console.log(chalk.bgWhite(chalk.red(`Example app listening on port ${port}!`))))
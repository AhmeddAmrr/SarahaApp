import mongoose from "mongoose";

const connectionDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL , {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection failed:', error.messaage);       
    }
}
export default connectionDB;
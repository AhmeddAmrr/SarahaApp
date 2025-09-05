import mongoose , {Schema } from "mongoose";

export const providers = {
    system:"SYSTEM",
    google:"GOOGLE",
};

export const roles = {
    user: "USER",
    admin: "ADMIN",
}


const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, 'First name must be at least 3 characters long'],
        maxlength: [20 , 'First name must be at most 20 characters long']
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, 'Last name must be at least 3 characters long'],
        maxlength: [20 , 'Last name must be at most 20 characters long']
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,

},
    password: {
        type: String,
        required: function() {
            return this.provider === providers.system? true : false;
            },
    },
    gender: {
        type: String,
        enum:{
        values: ["male", "female" ],
        message: "Gender must be either male or female"
        },
        default:"male"
    },
    phone: String,
    confirmEmail:  Date,
    confirmEmailOtp:String,
    confirmEmailOtpExpiration: Date,
    forgetPasswordOtp:String,
    forgetPasswordOtpExpiration: Date,
    profileImage:String,
    coverImages:[String],
    profileCloudImage:{
        public_id: String,
        secure_url: String,
    },
    coverCloudImages:[{
        public_id: String,
        secure_url: String,
    }],
    
    deletedAt : Date,
    deletedBy:{type: mongoose.Schema.Types.ObjectId , ref: "User"},
    restoredAt : Date,
    restoredBy:{type: mongoose.Schema.Types.ObjectId , ref: "User"},
    changeCredentialsTime: Date,
    provider:{
        type: String,
        enum: {
            values: Object.values(providers),
            message: 'Provider must be either SYSTEM or GOOGLE'
        },
        default: providers.system,
    },
    role:{
        type: String,
        enum:{
            values:Object.values(roles),
            message: 'Role must be either USER or ADMIN'
        },
        default: roles.user,
    }

},
 {  
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true},
 }
);

userSchema.virtual("messages" , {
    localField: "_id",
    foreignField: "recieverId",
    ref: "Message",
})

 const  UserModel = mongoose.models.User || mongoose.model('User', userSchema);
export default UserModel;
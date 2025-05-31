import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
    name:{
        type:String
    },
    lastName:String,
    emaail:String,
    password:String,
    lastSeen:Date,
});

const User=mongoose.model('User',userSchema);
export default User;
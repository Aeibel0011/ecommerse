const mongoose=require('mongoose');
require('dotenv').config()
const connect=mongoose.connect(process.env.mongodb)
connect
.then(()=>{
    console.log("database connected succesfuuly")
})
.catch(()=>{
    console.log("database cannot connected")
})



const details=new mongoose.Schema({

    username:{
        type:String,
        required:true
    },
  
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase: true

    },
    phone:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    islist:{
        type:Boolean,
        default:false
    },
    referralCode: {
        type: String,
        unique: true
    },
 
})

  

const collection=mongoose.model("users",details)

module.exports=collection
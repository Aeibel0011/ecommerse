const mongoose=require('mongoose')


const categorydetails=new mongoose.Schema({
    name:String,
    categoryimage:String,
    description:String,
    islist:{
        type:Boolean,
        default:true
    }
    
})


const categorymodel=mongoose.model("category",categorydetails)

module.exports=categorymodel
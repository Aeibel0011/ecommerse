const mongoose=require('mongoose')


productSchema=new mongoose.Schema({
    productname:String,
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'category'
    },
    currentqnt:Number,
    price:Number,
    description:String,
    size:String,
    productimage:[{
        type:String
    }],
    discountAmount: {
        type: Number,
        default: 0
    },
   
    islist:{
        type:Boolean,
        default:true
    }
})
let addproducts=mongoose.model('products',productSchema)

module.exports=addproducts;
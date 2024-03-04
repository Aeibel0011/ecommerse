const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;




const cartSchema = new Schema({
    user: {
      type: ObjectId,
      ref: 'User' 
    },
    products: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products' 
      },
      quantity: Number,
      isSelected:{  
        type:Boolean,
        default:false,
      }
    }],
    totalAmount: Number ,
    
    coupon: {
      type: ObjectId,
      ref: 'Coupon'
  },
  couponApplied: {
    type: Boolean,
    default: false
},
  discountAmount: {
      type: Number,
      default: 0
  }

  });
  




  


  const cartmodel = mongoose.model('cart', cartSchema);


  module.exports =cartmodel
  
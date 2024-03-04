const cart=require('../model/cartschema') 
const express = require('express');
const session = require('express-session');


 const product=async(req,res,next)=>{
    const userId = req.session.userdetails._id;
 const userCart = await cart.findOne({ user: userId,'products.isSelected':true }).populate('products.product'); // Make sure 'Cart' model is properly referenced
if(userCart){
 next();
}else{
    res.redirect('cart')
}
};

module.exports = {
    product
  };
  
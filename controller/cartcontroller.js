const express = require('express');
const model = require('../model/schema');
const productmodel = require('../model/productschema') 
const addressmodel = require('../model/addressSchema') 
const cart=require('../model/cartschema') 
const bcrypt = require('bcrypt');
const session = require('express-session');
const Coupon = require('../model/couponSchema');

const app = express();

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));


 
const postcart = async (req, res) => {
    // Check if user details are present in the session
    console.log('hello')
    if (!req.session.userdetails || !req.session.userdetails._id) {
        // Redirect to the login page
        return res.status(401).send({ redirectToLogin: true });
    }

    const productId = req.params.productId;
    const quantity = req.body.quantity || 1; // If quantity is not provided, default to 1
    const userId = req.session.userdetails._id; // Assuming userId is stored in the session

    try {
        // Find the user's cart and populate the product details
        let userCart = await cart.findOne({ user: userId });

        if (!userCart) {
            // If the user doesn't have a cart, create a new one
            userCart = new cart({
                user: userId,
                products: [],
                totalAmount: 0,
                coupon: null,
                discountAmount: 0,
            });
        }

        // Check if the product already exists in the user's cart
        const existingProduct = userCart.products.find(
            (product) => product.product.toString() === productId
        );
        console.log(existingProduct,'////cdhubdjkhcxhjgjsx ')

        if (existingProduct) {
            // If the product exists, update its quantity
            existingProduct.quantity += quantity;
        } else {
            // If the product doesn't exist, add it to the cart with the specified quantity
            userCart.products.push({ product: productId, quantity });
        }

        // Update totalAmount based on product prices
        let totalAmount = 0;
        for (const product of userCart.products) {
            const productDetails = await productmodel.findById(product.product);
            totalAmount += product.quantity * productDetails.price;
        }

        userCart.totalAmount = totalAmount;

        // Save the updated cart
        await userCart.save();

        res.status(200).send("Product added to cart successfully!");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};


const cartdisplay = async (req, res) => {
    try {
        let userlogin=false;
        if(req.session&&req.session.userdetails){
            userlogin=true;
        }
        const userId = req.session.userdetails._id;

        // Find the user's cart, populate product details
        const userCart = await cart.findOne({ user: userId }).populate('products.product'); // Make sure 'Cart' model is properly referenced
        const coupons = await Coupon.find({islist:true});
       
       
       
        res.render('user/cart', { userCart,userlogin,coupons });

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};




const postquantity = async (req, res) => {
    try {
        const productId = req.body.productId;
        const quantity = req.body.quantity;
        const userId = req.session.userdetails._id;

        let userCart = await cart.findOne({ user: userId }).populate('products.product');

        const existingProduct = userCart.products.find(
            (product) => product.product._id.toString() === productId
        );

        if (!existingProduct) {
            return res.status(404).send('Product not found in the cart.');
        }

        if (quantity > existingProduct.product.currentqnt) {
            return res.status(400).json({ error: 'The quantity exceeds the available stock.' });
        }

        // Update the quantity of the product in the cart
        await cart.findOneAndUpdate(
            { user: userId, 'products.product': productId },
            { $set: { 'products.$.quantity': quantity } }
        );

        // Calculate the total amount after updating the quantity
        let totalAmount = 0;
        for (const product of userCart.products) {
            const productDetails = await productmodel.findById(product.product._id);
            if (!productDetails) {
                return res.status(404).send('Product details not found.');
            }
            totalAmount += product.quantity * productDetails.price;
        }

        // Update the totalAmount field in the user's cart
        userCart.totalAmount = totalAmount;
        await userCart.save();

        return res.status(200).json({
            success: true,
            message: 'Quantity updated successfully.',
            totalPrice: calculateTotalPrice(existingProduct.product.price, quantity)
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const calculateTotalPrice = (price, quantity) => {
    return price * quantity;
};







const selectProduct = async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.session.userdetails._id;
        
        let userCart = await cart.findOne({ user: userId });

        userCart.products.forEach((product) => {
            if (product.product.toString() === productId) {
           
                product.isSelected = !product.isSelected;
            }
        });

        await userCart.save(); // Await the save operation

        res.status(200).json({ message: "Successfully toggled selection" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const deleteproduct = async (req, res) => {
    try {
        const productId = req.params.productId; 
        const userId = req.session.userdetails._id;

        const result = await cart.updateOne(
            { user: userId },
            { $pull: { products: { product: productId } } }
        );

        if (result.nModified === 0) {
            return res.status(404).json({ success: false, message: 'Cart not found or product not present' });
        }

        res.status(200).json({ success: true, message: 'Successfully deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};





 module.exports={
  
    postcart,
    cartdisplay,
    postquantity,
    selectProduct,
    deleteproduct,
   
    
 }
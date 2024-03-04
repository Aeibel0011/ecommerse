const express = require('express');
const model = require('../model/schema');
const productmodel = require('../model/productschema') 
const addressmodel = require('../model/addressSchema') 
const cart=require('../model/cartschema') 
const order=require('../model/orderschema') 
const Coupon = require('../model/couponSchema');
const niceInvoice = require("nice-invoice");
require('dotenv').config();
const Razorpay = require('razorpay');
const Wallet = require('../model/walletSchema');
const PDFDocument = require('pdfkit');
const path=require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');


const razorpay = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.Secret_key
});

const app = express();

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));




const getcheckout = async (req, res) => {
    try {
        let userlogin=false;
        if(req.session&&req.session.userdetails){
            userlogin=true;
        }
         const userId = req.session.userdetails._id;
       

        // Find the user's cart, populate product details
         const userCart = await cart.findOne({ user: userId,'products.isSelected':true }).populate('products.product'); // Make sure 'Cart' model is properly referenced
        const address = await addressmodel.findOne({ user: req.session.userdetails._id });
        const coupons = await Coupon.find({islist:true});
       
        res.render('user/checkout', { address ,userCart,userlogin,coupons});
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving addresses');
    }
};
const addnewaddress= async (req,res)=>{
    res.render('user/addnewaddress')
}

const addaddress = async (req, res) => {
    try {
        const userId = req.session.userdetails._id; // Assuming user ID is stored in the session

        const newaddress = {
            
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            address: req.body.address,
            phoneNumber: req.body.phoneNumber,
            pincode: req.body.pincode,
            city: req.body.city,
            state: req.body.state
        };
      
        // Check if any address with the same values already exists for the user
        const existingaddress = await addressmodel.findOne({
            user: userId,
            'addresses': {
                $elemMatch: {
                    firstName: newaddress.firstName,
                    lastName: newaddress.lastName,
                    address: newaddress.address,
                    phoneNumber: newaddress.phoneNumber,
                    pincode: newaddress.pincode,
                    city: newaddress.city,
                    state: newaddress.state
                }
            }
        });

        if (existingaddress) {
            // Address already exists, show alert message
            const datas = req.session.userdetails;
            return res.render('user/profile', { datas, alertMessage: 'Address already exists!' });
        }
        

        // Get the existing addresses for the user
        const useraddresses = await addressmodel.findOne({ user: userId });

        if (useraddresses) {
            // Update the existing addresses by pushing the new address
            useraddresses.addresses.push(newaddress);
            await useraddresses.save();
        } else {
            // If no existing addresses, create a new document
            await addressmodel.create({
                user: userId,
                addresses: [newaddress]
            });
        }

        res.redirect('/checkout'); // Redirect to the user's profile page
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};




const postcheckout = async (req, res) => {
    try {

        

        const userId = req.session.userdetails  ;
        const userAddresses = await addressmodel.findOne({ user: userId });
        const paymentmethod = req.body.paymentmethod;
        const selectedAddressId = req.body.addressId;

        if (!userAddresses) {
            return res.status(404).json({ message: 'No addresses found for the user' });
        }

        const selectedAddress = userAddresses.addresses.find(address => address._id.toString() === selectedAddressId.toString());

        if (!selectedAddress) {
            return res.status(404).json({ message: 'Address not found for the provided ID' });
        }

        

        if(paymentmethod === 'cod'){

            const selectedProducts = await cart.findOne({ user: userId }).populate('products.product');
            const cartProducts = selectedProducts.products.filter(item => item.isSelected === true);
                
            // Find the number of different products
            const numberOfProducts = new Set(cartProducts.map(item => item.product.toString())).size;
         console.log(numberOfProducts,'//number')
            // Validate products and update quantities
            for (const cartProduct of cartProducts) {
                const quantitydecrease = await productmodel.findById(cartProduct.product._id);
                if (!quantitydecrease || quantitydecrease.currentQut < cartProduct.quantity) {
                    return res.status(400).json({ message: 'Product not found or insufficient quantity' });
                }
                // Decrease product quantity
                quantitydecrease.currentQut -= cartProduct.quantity;
                await quantitydecrease.save();
            }
            const usercart= await cart.findOne({ user: userId })
            const orders = new order({
                userId: userId,
                paymentMethod: paymentmethod,
                address: {
                    firstName: selectedAddress.firstName,
                    lastName: selectedAddress.lastName,
                    address: selectedAddress.address,
                    phoneNumber: selectedAddress.phoneNumber,
                    pincode: selectedAddress.pincode,
                    city: selectedAddress.city,
                    state: selectedAddress.state
                },
                products: [],
                totalAmount: 0,
            });
            for (const cartProduct of cartProducts) {
                const productData = {
                    productId: cartProduct.product._id,
                    quantity: cartProduct.quantity,
                    salesPrice: cartProduct.product.price - (usercart.discountAmount / numberOfProducts),
                    total: cartProduct.quantity * (cartProduct.product.price - (usercart.discountAmount / numberOfProducts)),
                    cancelstatus: false,
                    reason: '', // Populate this based on certain conditions
                };
                console.log(productData.quantity,'qyantuty')
                console.log(productData.salesPrice,'/pricehai')
                console.log(usercart.discountAmount,'nothinf')
                orders.products.push(productData);
                orders.totalAmount += productData.total;
            };

            await orders.save();
        // Find the user's cart
        const userCart = await cart.findOne({ user: userId }).populate('coupon');

        if (!userCart) {
            return res.status(404).json({ message: 'Cart not found for the user' });
        }

        // Check if a coupon is currently applied
        if (userCart.couponApplied) {
            // Get the coupon details
            const coupon = await Coupon.findById(userCart.coupon);

            if (!coupon) {
                return res.status(404).json({ message: 'Coupon not found' });
            }

            // Increment the usageCount of the coupon
            coupon.usageCount++;
            await coupon.save();
               userCart.coupon=null;
            // Reset the couponApplied flag to false
            userCart.couponApplied = false;
            // Reset discountAmount
            userCart.discountAmount = 0;
            // Save the updated cart
            await userCart.save();
        }
    




        await cart.updateOne({ user: userId }, { $pull: { products: { isSelected: true } } });
        return res.status(200).json({ message: 'Order placed successfully', order: orders });
        } 
        else if (paymentmethod === 'wallet') {
            const selectedProducts = await cart.findOne({ user: userId }).populate('products.product');
            const cartProducts = selectedProducts.products.filter(item => item.isSelected === true);
            //number of products
            const numberOfProducts = new Set(cartProducts.map(item => item.product.toString())).size;
            console.log(numberOfProducts,'//number')
            // Calculate total order amount
            const totalOrderAmount = cartProducts.reduce((total, cartProduct) => {
                return total + (cartProduct.isSelected ? cartProduct.product.price * cartProduct.quantity : 0);
            }, 0);
        
            // Check if the user has sufficient balance in the wallet
            const wallet = await Wallet.findOne({ user: userId });
            console.log(wallet)
            if (!wallet || wallet.balance < totalOrderAmount) {
                    console.log('error')
                    console.log("//////")
            return res.status(200).json({ message: 'Insufficient balance in wallet' });
            }
        
            // Deduct the order amount from the wallet balance
            wallet.balance -= totalOrderAmount;
            await wallet.save();
            const usercart= await cart.findOne({ user: userId })
            // Proceed with order placement
            const orders = new order({
                userId: userId,
                paymentMethod: paymentmethod,
                address: {
                    firstName: selectedAddress.firstName,
                    lastName: selectedAddress.lastName,
                    address: selectedAddress.address,
                    phoneNumber: selectedAddress.phoneNumber,
                    pincode: selectedAddress.pincode,
                    city: selectedAddress.city,
                    state: selectedAddress.state
                },
                products: [],
                totalAmount: totalOrderAmount, // Total order amount
            });
        
            // Create order
            for (const cartProduct of cartProducts) {
                const productData = {
                    productId: cartProduct.product._id,
                    quantity: cartProduct.quantity,
                    salesPrice: cartProduct.product.price - (usercart.discountAmount / numberOfProducts),
                    total: cartProduct.quantity * (cartProduct.product.price - (usercart.discountAmount / numberOfProducts)),
                    cancelstatus: false,
                    reason: '', // Populate this based on certain conditions
                };
                console.log(productData.quantity,'qyantuty')
                console.log(productData.salesPrice,'/pricehai')
                console.log(usercart.discountAmount,'nothinf')
                orders.products.push(productData);
               
            };

            await orders.save();
           
        
            const wallets = await Wallet.findOne({ user: userId });
        const transaction = {
            amount: totalOrderAmount,
            description: 'Debited money from wallet',
            date: new Date(),
        };
        wallets.transactions.push(transaction);
            await wallets.save();

           // Find the user's cart
        const userCart = await cart.findOne({ user: userId }).populate('coupon');

        if (!userCart) {
            return res.status(404).json({ message: 'Cart not found for the user' });
        }

        // Check if a coupon is currently applied
        if (userCart.couponApplied) {
            // Get the coupon details
            const coupon = await Coupon.findById(userCart.coupon);

            if (!coupon) {
                return res.status(404).json({ message: 'Coupon not found' });
            }

            // Increment the usageCount of the coupon
            coupon.usageCount++;
            await coupon.save();
               userCart.coupon=null;
            // Reset the couponApplied flag to false
            userCart.couponApplied = false;
            // Reset discountAmount
            userCart.discountAmount = 0;
            // Save the updated cart
            await userCart.save();
        }
    

        await cart.updateOne({ user: userId }, { $pull: { products: { isSelected: true } } });
            return res.status(200).json({ message: 'Order placed successfully', order: orders });
        } 
        
        
      
        else if(paymentmethod == 'razorpay'){





            const selectedProducts = await cart.findOne({ user: userId }).populate('products.product');
            const cartProducts = selectedProducts.products.filter(item => item.isSelected === true);
             //number of products
              const numberOfProducts = new Set(cartProducts.map(item => item.product.toString())).size;
                  console.log(numberOfProducts,'//number')
                 // Validate products and update quantities
            for (const cartProduct of cartProducts) {
                const quantitydecrease = await productmodel.findById(cartProduct.product._id);
                
                if (!quantitydecrease || quantitydecrease.currentQut < cartProduct.quantity) {
                    return res.status(400).json({ message: 'Product not found or insufficient quantity' });
                }
    
                // Decrease product quantity
                quantitydecrease.currentQut -= cartProduct.quantity;
                await quantitydecrease.save();
            }
            const totalOrderAmount = cartProducts.reduce((total, cartProduct) => {
                return total + (cartProduct.isSelected ? cartProduct.product.price * cartProduct.quantity : 0);
            }, 0);
        
    
            const usercart= await cart.findOne({ user: userId })
            // Proceed with order placement
            const orders = new order({
                userId: userId,
                paymentMethod: paymentmethod,
                address: {
                    firstName: selectedAddress.firstName,
                    lastName: selectedAddress.lastName,
                    address: selectedAddress.address,
                    phoneNumber: selectedAddress.phoneNumber,
                    pincode: selectedAddress.pincode,
                    city: selectedAddress.city,
                    state: selectedAddress.state
                },
                products: [],
                totalAmount: totalOrderAmount, // Total order amount
            });
        
            // Create order
            for (const cartProduct of cartProducts) {
                const productData = {
                    productId: cartProduct.product._id,
                    quantity: cartProduct.quantity,
                    salesPrice: cartProduct.product.price - (usercart.discountAmount / numberOfProducts),
                    total: cartProduct.quantity * (cartProduct.product.price - (usercart.discountAmount / numberOfProducts)),
                    cancelstatus: false,
                    reason: '', // Populate this based on certain conditions
                };
                console.log(productData.quantity,'qyantuty')
                console.log(productData.salesPrice,'/pricehai')
                console.log(usercart.discountAmount,'nothinf')
                orders.products.push(productData);
                orders.totalAmount += productData.total;
               
            };

            
           


            const totalAmountWithoutDiscount = cartProducts.reduce((total, cartProduct) => {
                return total + (cartProduct.isSelected ? cartProduct.product.price * cartProduct.quantity : 0);
            }, 0);
            
            const totalAmount = totalAmountWithoutDiscount - usercart.discountAmount;
            
            const options = {
                amount: ((totalAmount + 120) * 100), // Add the additional amount after subtracting the discountAmount
                currency: 'INR',
                receipt: 'order_' + Date.now()
            };
            
            

   


                try {

                    const order=await  new Promise ((resolve,reject)=>{

                        razorpay.orders.create(options,(err,order)=>{
                            if(err){
                                console.log(err)
                            }
                            else{
                                resolve(order)
                            }
                        })
     

                    })
                    orders.orderId=order.id
                 
                    await orders.save();

        
                     // Find the user's cart
        const userCart = await cart.findOne({ user: userId }).populate('coupon');

        if (!userCart) {
            return res.status(404).json({ message: 'Cart not found for the user' });
        }

        // Check if a coupon is currently applied
        if (userCart.couponApplied) {
            // Get the coupon details
            const coupon = await Coupon.findById(userCart.coupon);

            if (!coupon) {
                return res.status(404).json({ message: 'Coupon not found' });
            }

            // Increment the usageCount of the coupon
            coupon.usageCount++;
            await coupon.save();
               userCart.coupon=null;
            // Reset the couponApplied flag to false
            userCart.couponApplied = false;
            // Reset discountAmount
            userCart.discountAmount = 0;
            // Save the updated cart
            await userCart.save();
        }
    



  


                    await cart.updateOne({ user: userId }, { $pull: { products: { isSelected: true } } });
                   res.status(200).json({success:true,orderId:order.id,order,Key_id:process.env.key_id}) 
                } catch (error) {
                    console.log(error)
                }
           
        }

       

        
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const crypto = require('crypto');

const verify = async (req, res) => {
    try {
        
        
     
        const orderCreationId = req.body.data.orderCreationId;
        const razorpayPaymentId = req.body.data.razorpayPaymentId;
        const razorpayOrderId = req.body.data.razorpayOrderId;
        const razorpaySignature = req.body.data.razorpaySignature;

      
        const orders = await order.findOne({orderId:razorpayOrderId });
        

   
        const shasum = crypto.createHmac("sha256", process.env.Secret_key);

        shasum.update(`${orderCreationId}|${razorpayPaymentId}`); // Add missing backticks

        const digest = shasum.digest("hex");

        if (digest !== razorpaySignature) {
            return res.status(400).json({ msg: "Transaction not legit!" });
        }

        // PAYMENT IS LEGIT & VERIFIED
        // You might want to update the order in your database or perform other actions

        res.status(200).json({
            msg: "success",
            orderId:orders._id,
            paymentId: razorpayPaymentId,
            order: orders, // Include the order data in the response
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ msg: "Server Error" });
    }
};

//success page

const success= async (req,res)=>{
    try {
      
        const data=req.params.orderId
   
        const orderfind= await order.findById(data)
   
    
    res.render('user/success',{orderfind})
    } catch (error) {
        console.log(error)
    }
   
  
}


//invoice 

const invoice = async (req, res) => {
    const data = req.params.orderId;

  

    const finddata = await order
        .findOne({_id:data})
        .populate('userId')
        .populate('products.productId');
        

      

    // Assuming finddata exists and contains necessary information

    // Constructing invoiceDetail object
    const invoiceDetail = {
        shipping: {
            name: finddata.address.firstName + ' ' + finddata.address.lastName,
            Address:finddata.address.address,
            city: finddata.address.city,
            state: finddata.address.state,
            mobile: finddata.address.phoneNumber,
            pin_code: finddata.address.pincode,
        },
        items: finddata.products.map((product) => ({
            item: product.productId.productname,
            description: product.productId.description,
            quantity: product.quantity,
            price: product.salesPrice, 
        })),
        subtotal: finddata.totalAmount,
        total: finddata.totalAmount + 120,
        order_number: finddata.orderId, // Set the correct order number property
        header: {
            company_name: "Urban Charms",
            company_address: "Urban Charms, Indira Nagar 1st Stage, Indiranagar, Bengaluru, Karnataka 560038",
            
        },  
        footer: {
            text: "Thank you for your Purchase!",
        },
        currency_symbol: "₹", // Indian Rupee symbol
        date: {
            billing_date: "January 17, 2024",
            due_date: "February 27, 2024",
        },
    };


    // Generating the PDF
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument();

    // Pipe the PDF to the response
    res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
    res.setHeader('Content-Type', 'application/pdf');

    // Generate PDF content based on the invoiceDetail object
    doc.pipe(res);

    // Add content to the PDF
    doc.font('Helvetica');

    // Header
    doc.fontSize(24).text('Invoice', { align: 'center', underline: true }).moveDown(1);

    // Customer Details Section
    doc.fontSize(12).text('Customer Details:', { underline: true }).moveDown(0.5);
    doc.fontSize(10).text(`Name: ${invoiceDetail.shipping.name}`);
    doc.fontSize(10).text(`Address: ${invoiceDetail.shipping.Address}`);
    doc.fontSize(10).text(`City: ${invoiceDetail.shipping.city}, State: ${invoiceDetail.shipping.state}`);
    doc.fontSize(10).text(`Mobile: ${invoiceDetail.shipping.mobile}, Pincode: ${invoiceDetail.shipping.pin_code}`);
    doc.moveDown(1);

    // Items Section
    doc.fontSize(12).text('Items:', { underline: true }).moveDown(0.5);
    invoiceDetail.items.forEach(item => {
        doc.fontSize(10).text(`Item: ${item.item}`);
        doc.fontSize(10).text(`Description: ${item.description}`);
        doc.fontSize(10).text(`Quantity: ${item.quantity}, Price: ${item.price}/-`);
        doc.moveDown(0.5);
    });

    // Summary Section
    doc.fontSize(12).text('Summary:', { underline: true }).moveDown(0.5);
    doc.fontSize(10).text(`Subtotal: ${invoiceDetail.subtotal}/-`, { align: 'left' });
    doc.fontSize(10).text('shipping fee:120/-')
    doc.fontSize(10).text(`Total: ${invoiceDetail.total}/-`, { align: 'left' });

    doc.moveDown(1);

    // Company Information Section
    doc.fontSize(12).text('Company Information:', { underline: true }).moveDown(0.5);
    doc.fontSize(10).text(invoiceDetail.header.company_name, { align: 'center' });
    doc.fontSize(8).text(invoiceDetail.header.company_address, { align: 'center' }).moveDown(1);

    // Footer
    doc.fontSize(10).text(invoiceDetail.footer.text, { align: 'center' });

    // End the document
    doc.end();
};

const applyCoupon = async (req, res) => {
    try {
        const couponCode = req.body.couponId;
        const userId = req.session.userdetails._id;

        // Find the user's cart and get the total amount
        const userCart = await cart.findOne({ user: userId, 'products.isSelected': true });
        const totalAmount = userCart.totalAmount;

        // Find the coupon with the provided code
        const coupon = await Coupon.findOne({ _id: couponCode });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found.' });
        }

        // Check if the coupon is expired
        if (coupon.expiryDate < new Date()) {
            return res.status(400).json({ success: false, message: 'Coupon has expired.' });
        }

        // Check if the coupon has reached its usage limit
        if (coupon.usageCount >= coupon.usageLimit) {
            return res.status(400).json({ success: false, message: 'Coupon has reached its usage limit.' });
        }

        // Check if the user is eligible to use the coupon (based on any specific criteria)

        // Check if the total amount meets the minimum purchase requirement specified by the coupon
        if (totalAmount < coupon.minimumAmount) {
            return res.status(400).json({ success: false, message: 'Total amount does not meet the minimum purchase requirement for this coupon.' });
        }

        // Apply the coupon and calculate the discount amount
        // Replace this logic with your actual coupon application logic
        const discountAmount = calculateDiscount(totalAmount, coupon.discountPercentage);
        // Calculate the new total amount after applying the discount
        const newTotalAmount = totalAmount - discountAmount;
         const roundeddiscountAmount = Math.ceil(discountAmount);



        userCart.discountAmount=roundeddiscountAmount 
        // Update the cart with the new total amount
       // Convert newTotalAmount to an integer (rounding down)
      const roundedTotalAmount = Math.ceil(newTotalAmount);

// Assign the rounded totalAmount to userCart
userCart.totalAmount = roundedTotalAmount;
userCart.couponApplied = true;
userCart.coupon=couponCode;
        console.log(userCart.totalAmount,'///////heil')
        await userCart.save();

        // Increment the usage count of the coupon
        // coupon.usageCount++;
        await coupon.save();

        // Send the updated total amount and discount amount to the frontend
        return res.status(200).json({ success: true, message: 'Coupon applied successfully.', newTotalAmount, discountAmount });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


const calculateDiscount = (totalAmount, discountPercentage) => {
    return (totalAmount * discountPercentage) / 100;
};

const removeCoupon = async (req, res) => {
    try {
        const userId = req.session.userdetails._id;

        // Find the user's cart
        const userCart = await cart.findOne({ user: userId, 'products.isSelected': true });

        if (!userCart) {
            return res.status(404).json({ success: false, message: 'Cart not found for the user' });
        }

        // Check if a coupon is currently applied
        if (!userCart.couponApplied) {
            return res.status(400).json({ success: false, message: 'No coupon applied to the cart' });
        }


          // Add the discountAmount back to the totalAmount
          userCart.totalAmount += userCart.discountAmount;
        // Reset the couponApplied flag to false and reset discountAmount
        userCart.couponApplied = false;
        userCart.discountAmount = 0;
        userCart.coupon=null;

      
         
        // Save the updated cart
        await userCart.save();

        return res.status(200).json({ success: true, message: 'Coupon removed successfully.', cart: userCart });
    } catch (error) {
        console.error('Error removing coupon:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


module.exports={
getcheckout,
addaddress,
addnewaddress,
postcheckout,
verify,
success,
invoice,
applyCoupon,
removeCoupon
}
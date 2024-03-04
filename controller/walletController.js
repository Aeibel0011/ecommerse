const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const niceInvoice = require("nice-invoice");
require('dotenv').config();
const Razorpay = require('razorpay');
const PDFDocument = require('pdfkit');
const path=require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const Wallet = require('../model/walletSchema');

const razorpay = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.Secret_key
});

const addMoney=async(req,res)=>{
    try {
        const userId = req.session.userdetails._id; // Assuming you have a session with user details
        const amountToAdd = req.body.amount;

        // Create Razorpay order
        const options = {
            amount: amountToAdd*100 , // Amount in paisa
            currency: 'INR',
            receipt: 'wallet_' + Date.now()
        };

        const order = await new Promise((resolve, reject) => {
            razorpay.orders.create(options, (err, order) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(order);
                }
            });
        });
  if(order){
        // Save the transaction details in the wallet
        const wallet = await Wallet.findOne({ user: userId });
        const transaction = {
            amount: amountToAdd,
            description: 'Added money to wallet',
            date: new Date(),
        };
        wallet.transactions.push(transaction);
       
// Recalculate wallet balance based on transactions
const newBalance = wallet.transactions.reduce((total, transaction) => {
    return total + transaction.amount;
}, 0);

// Update wallet balance
wallet.balance = newBalance;
        await wallet.save();

        // Return success response to the client
        res.status(200).json({
            success: true,
            orderId: order.id,
            order,
        });
    }else{
        res.status(500).json({success:false,message:' Payment Not completed'})
    }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

//verify


const verify = async (req, res) => {
    try {
        // Extract the payment details from the request body
  
        const razorpay_payment_id=req.body.razorpayPaymentId;
       const  razorpay_order_id=req.body.razorpayOrderId;
       const razorpay_signature=req.body.razorpaySignature;
       
        // Construct the string to be signed
        const text = razorpay_order_id + '|' + razorpay_payment_id;
        const generated_signature = crypto.createHmac('sha256',  process.env.Secret_key)
            .update(text)
            .digest('hex');
              
        // Verify the signature
        if (generated_signature === razorpay_signature) {
            // Signature verification successful
            // Perform additional checks if needed (e.g., verify payment amount)

            // Return success response
            res.status(200).json({ success: true, message: 'Payment verified successfully' });
        } else {
            // Signature verification failed
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};




module.exports={
    addMoney,
    verify,
}
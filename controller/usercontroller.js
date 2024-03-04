const express = require("express");
const model = require("../model/schema");
const productmodel = require("../model/productschema");
const addressmodel = require("../model/addressSchema");
const bcrypt = require("bcrypt");
const categorymodel = require("../model/categoryschema");
const cart=require('../model/cartschema') 
const Banner = require('../model/bannerSchema');
const nodemailer = require("nodemailer");
const session = require("express-session");
const randomstring = require("randomstring");
const Wallet = require('../model/walletSchema');
require("dotenv").config();

const app = express();

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);
// otp
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

function generateOtp() {
  return randomstring.generate({
    length: 6,
    charset: "numeric",
  });
}

function sendOtp(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_ADDRESS,
    to: email,
    subject: "Your OTP for registering at LapBook",
    text: `Your OTP for verification is ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email: " + error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

// get home
const homeget = async (req, res) => {
    try {
        // Fetch banner data from the database
        const banners = await Banner.find({ islist:true });

        // Check if user is logged in
        let userlogin = false;
        if (req.session && req.session.userdetails) {
            userlogin = true;
        }

        // Render the home page template with banner data and user login status
        res.render("user/home", { banners, userlogin });
    } catch (error) {
        console.error('Error fetching banner data:', error);
        // Handle error
        res.status(500).send('Internal Server Error');
    }
};


// get login
const loginget = async (req, res) => {
  res.render("user/login", { alertMessage: null });
};

// get signup
const signupget = async (req, res) => {
  res.render("user/signup", { alertMessage: null });
};

// get otp
const getotp = async (req, res) => {
  res.render("user/otp", { alertMessage: null });
};

// post signup
const postsignup = async (req, res) => {
  const data = {
    username: req.body.username,
    email: req.body.email,
    phone: req.body.phone,
    password: req.body.password,
    referralCode:null,
  };

   // Check if the user signed up using a referral code
   const referralCode = req.body.referralCode; // Assuming the referral code is passed in the query string

   // Generate a unique referral code for the new user
   const generatedReferralCode = generateReferralCode();

   // Set the generated referral code for the new user
   data.referralCode = generatedReferralCode;

   if (referralCode) {
  
        // Find the referrer using the referral code
        const user = await model.findOne({ referralCode: referralCode });

        if (!user) {
          res.render("user/signup", { alertMessage: "Referral Code is Invalid!" });
          return;
        }
           
        // Find the wallet associated with the user
        const wallet = await Wallet.findOne({ user: user._id });
      
        if (!wallet) {
          console.log('Wallet not found for user:', user._id);
          return;
        }
        const addamount=300
        const transaction = {
            amount:addamount ,
            description: 'Added money to wallet',
            date: new Date(),
        };
        wallet.transactions.push(transaction);
       
        // Update the wallet balance (e.g., add 100 to the existing balance)
        const referralBonus = 300;
        wallet.balance += referralBonus;
    
        // Save the updated wallet
        await wallet.save();
    
        console.log('Wallet balance updated successfully for user:', user._id);
   }

  // checking if the user exists
  const userexist = await model.findOne({ email: data.email });

  if (userexist) {
    // User exists, show alert message
    res.render("user/signup", { alertMessage: "User already exists!" });
  } else {
    
    // User does not exist, proceed with registration
    const saltRounds = 10; // number of salt Rounds for bcrypt
    const hashedpassword = await bcrypt.hash(data.password, saltRounds);

    data.password = hashedpassword;

    req.session.hashedpassword = hashedpassword;
    req.session.userdetails = data;
 

    const otp = generateOtp();
    console.log(otp,'/otp')
    const expirationTime = new Date(Date.now() + 30 * 1000);// 30 seconds in milliseconds
        
        req.session.otp = {
            code: otp,
            generatedAt: Date.now(), // Store the timestamp when the OTP was generated
            expirationTime: expirationTime.getTime() // Store the expiration time as a timestamp
        };
    await sendOtp(data.email, otp);

    try {
      res.redirect("/otp");
    } catch (error) {
      res.status(404).send("invalid");
    }
  }
};
// Function to generate a unique referral code
function generateReferralCode() {
  return Math.random().toString(36).substr(2, 10).toUpperCase(); // Generate a 6-character alphanumeric code
}

// post otp
const postotp = async (req, res) => {
   console.log(req.session.otp.code)
  try {
    const formotp = req.body.formotp.replace(/\s+/g, ""); // Remove all whitespaces

    if (formotp == req.session.otp.code) {
      const userdata = await model.create(req.session.userdetails);
   

      // Create wallet for the user
      const newWallet = await Wallet.create({
        user: userdata._id,
        balance: 0,
        transactions: [],
        pendingOrder: {
          orderId: "",
          amount: 0,
          currency: ""
        }
      });
     
      req.session.walletId = newWallet._id;
      let userCart = await cart.findOne({ user: userdata._id});

      if (!userCart) {
          // If the user doesn't have a cart, create a new one
          userCart = new cart({
              user: userdata._id,
              products: [],
              totalAmount: 0,
              coupon: null,
              discountAmount: 0,
          });
      }
      res.redirect("/login");
    } else {
      res.render("user/otp", {
        alertMessage: "Invalid OTP. Please try again.",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// post login
const postlogin = async (req, res) => {
  try {
    let userlogin = false;
    if (req.session && req.session.userdetails) {
      userlogin = true;
    }
    const check = await model.findOne({
      email: { $regex: new RegExp(req.body.email, "i") },
    });

    if (!check) {
      return res.render("user/login", { alertMessage: "Invalid email" });
    }
    if (check.islist) {
      return res.render("user/login", { alertMessage: "user is blocked" });
    }
    const ispassword = await bcrypt.compare(req.body.password, check.password);

    if (ispassword) {
      req.session.userdetails = check;
      res.redirect("/");
    } else {
      return res.render("user/login", { alertMessage: "Invalid password" });
    }
  } catch (error) {
    console.error(error);
    res.send("invalid");
  }
};

//resend otp
const resend = async (req, res) => {
  try {
      const email = req.session.userdetails.email ;
     

      // if (!userExists) {
      //     res.status(404).send('User not found');
      //     return;
      // }

      const newOtp = generateOtp();
      console.log(newOtp,'////newotp')
      delete req.session.otp;
      req.session.otp = {
          code: newOtp,
          generatedAt: Date.now(),
          expirationTime: new Date(Date.now() + 30 * 1000).getTime(), // Set expiration time (30 seconds in this example)
      };

      sendOtp(email, newOtp);

      res.status(200).json({success:true})
  } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
  }
};
//get user category

const getusercategory = async (req, res) => {
    try {
      let userlogin = false;
      if (req.session && req.session.userdetails) {
        userlogin = true;
      }
  
      // Pagination logic
      const page = parseInt(req.query.page) || 1;
      const pageSize = 10; // Number of products per page
      const skip = (page - 1) * pageSize;
  
      // Fetch all categories
      
      const allCategories = await categorymodel.find({});
  
  
      // Check if any category filter is applied
      const selectedCategories = req.query.categories
        ? req.query.categories.split(",")
        : [];
      console.log("Selected categories:", selectedCategories);
      const filter =
        selectedCategories.length > 0
          ? { category: { $in: selectedCategories } }
          : {};
  
      // Fetch products with pagination and filtering
      console.log("Fetching products with filter:", filter);
      const products = await productmodel
        .find({ islist: true, ...filter })
        .populate("category")
        .skip(skip)
        .limit(pageSize);
      console.log("Filtered products:", products);
  
      // Count total number of products for pagination
      const totalProducts = await productmodel.countDocuments({
        islist: true,
        ...filter,
      });

  
      // Calculate total number of pages
      const totalPages = Math.ceil(totalProducts / pageSize);
      
  
      res.render("user/category", {
        products,
        userlogin,
        currentPage: page,
        totalPages,
        categories: allCategories,
        selectedCategories,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  };
  
//product view

const getuserproducts = async (req, res) => {
  let userlogin = false;
  if (req.session && req.session.userdetails) {
    userlogin = true;
  }

  const id = req.params.producId;
  const data = await productmodel.findOne({ _id: id });

  res.render("user/product", { data, userlogin });
};

const changepassword = (req, res) => {
  res.render("user/changepassword");
};

// Replace with the actual path

// Import SweetAlert2 library
const Swal = require("sweetalert2");

const postchangepassword = async (req, res) => {
  const userId = req.session.userdetails._id;
  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;
  const confirmPassword = req.body.confirmPassword;

  try {
    // Find the user by ID
    const userData = await model.findById(userId);

    // Validate current password using bcrypt.compare
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      userData.password
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Invalid current password" });
    }

    // Validate new password and confirm password
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "New password and confirm password do not match" });
    }

    // Hash the new password before saving it to the database
    const hashedPassword = await bcrypt.hash(newPassword, 10); // 10 is the number of salt rounds

    // Update the user's password with the hashed password
    userData.password = hashedPassword;
    await userData.save();

    // Show SweetAlert success message
    Swal.fire({
      icon: "success",
      title: "Password changed successfully!",
      showConfirmButton: false,
      timer: 1500, // Close the alert after 1.5 seconds
    });

    res.redirect("/profile");
  } catch (error) {
    console.error("Error:", error);

    res.status(500).json({ message: "Internal Server Error" });
  }
};

//  logout

// Logout route
const getlogout = async (req, res) => {
  // Clear the session or perform any necessary logout actions
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Internal Server Error");
    }
    // Redirect or send a success response
    res.redirect("/login"); // Redirect to login page after logout
  });
};

module.exports = {
  loginget,
  homeget,
  signupget,
  getotp,
  postsignup,
  postlogin,
  postotp,
  getusercategory,
  getuserproducts,
  getlogout,
  changepassword,
  postchangepassword,
  resend,

};

var express = require("express");
var router = express.Router();
var user = require("../controller/usercontroller");
var profile = require("../controller/profilecontroller");
var cart = require("../controller/cartcontroller");
var checkout = require("../controller/checkoutcontroller");
var Wallet = require("../controller/walletController");
const model = require("../model/schema");
const isSession = require("../middlewares/isAuthenticates");
const isproduct = require("../middlewares/isproduct");
const couponController = require("../controller/couponController");




// login and signup..............

// get home page
router.get("/", isSession.checksession, user.homeget);
/* GET login page */
router.get("/login",isSession.isloged, user.loginget);
// get  signup page
router.get("/signup",isSession.isloged, user.signupget);
// get otp
router.get("/otp", user.getotp);
//post otp
router.post("/otp", user.postotp);
//resend otp
router.post('/resendotp',user.resend)
//post signup
router.post("/signup", user.postsignup);
// post login
router.post("/login", user.postlogin);

// product...............................

//get  user category
router.get("/category", user.getusercategory);
//get user products
router.get("/product/:producId", user.getuserproducts);

//cart.....................

//post cartpost
router.post("/postcart/:productId", isSession.checksession, cart.postcart);
//get user
router.get(
  "/cart",
  isSession.checksession,
  isSession.checksession,
  cart.cartdisplay
);
//quantity post
router.post("/quantitypost", isSession.checksession, cart.postquantity);
//seleted post
router.post(
  "/selectProduct/:productId",
  isSession.checksession,
  cart.selectProduct
);
//delete product
router.delete(
  "/deleteItem/:productId",
  isSession.checksession,
  cart.deleteproduct
);

//profile.........................................

//get profile
router.get("/profile", isSession.checksession, profile.getprofile);
//post add-address
router.post("/add-address", isSession.checksession, profile.postaddress);
//get edit address
router.get("/editaddress", isSession.checksession, profile.geteditaddress);
//post edit address
router.post("/editaddress", isSession.checksession, profile.posteditaddress);
//delete address
router.delete("/deleteaddress/:addressId", profile.deleteAddress);
//post edit user account
router.post("/editaccount", isSession.checksession, profile.posteditaccount);
//to view order details
router.get(
  "/orderdetails/:orderId",
  isSession.checksession,
  profile.orderdetails
);
//cancel orders
router.post("/cancelorder", isSession.checksession, profile.cancelorder);
router.get("/changepassword", isSession.checksession, user.changepassword);
router.post("/changepassword", isSession.checksession, user.postchangepassword);

//chekout..........................

//get checkout
router.get(
  "/checkout",
  isproduct.product,
  isSession.checksession,
  checkout.getcheckout
);
router.get("/addnewaddress", isSession.checksession, checkout.addnewaddress);
// add address
router.post("/addaddress", isSession.checksession, checkout.addaddress);
// post checkout
router.post("/checkoutpost", isSession.checksession, checkout.postcheckout);
//succes page
router.get("/success/:orderId", isSession.checksession, checkout.success);
//invoice
router.get("/invoice/:orderId", checkout.invoice);
//razo
router.post("/razo_verify", checkout.verify);
// apply Coupon
router.post("/applyCoupon", isSession.checksession, checkout.applyCoupon);
//remove coupon
router.post("/removeCoupon", isSession.checksession, checkout.removeCoupon);

// // get forgot password page
// router.get('/forgotpassword', user.forgotPasswordGet);

// // post forgot password
// router.post('/forgotpassword', user.forgotPasswordPost);

// // get reset password page
// router.get('/resetpassword/:resetToken', user.resetPasswordGet);

//wallet
// Endpoint to add money to wallet
router.post("/add-money", isSession.checksession, Wallet.addMoney);

// Endpoint to verify payment
router.post("/verify", isSession.checksession, Wallet.verify);

// is logged

//logout
router.get("/logout", user.getlogout);

module.exports = router;

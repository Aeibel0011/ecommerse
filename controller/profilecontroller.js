const express = require('express');
const model = require('../model/schema');
const productmodel = require('../model/productschema') 
const addressmodel = require('../model/addressSchema') 
const order=require('../model/orderschema') 
const Wallet = require('../model/walletSchema');
const bcrypt = require('bcrypt');
const session = require('express-session');


const app = express();

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));


//get profile


const ITEMS_PER_PAGE = 10; // Adjust as needed

const getprofile = async (req, res) => {
    try {
        let userlogin = false;
        if (req.session && req.session.userdetails) {
            userlogin = true;
        }

        // Access user data from the session
        const datas = req.session.userdetails;
      console.log(req.session.userdetails,'////')
        // Fetch additional data from the database
        const address = await addressmodel.findOne({ user: req.session.userdetails });
         
        const totalOrders = await order.countDocuments({ userId: req.session.userdetails._id });
        const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);
        const page = parseInt(req.query.page) || 1;

        const orders = await order.find({ userId: req.session.userdetails._id })
            .populate('products.productId')
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);

       
        const wallet = await Wallet.findOne({ user: req.session.userdetails._id }).populate('transactions'); // Assuming you want to populate transactions
        console.log(wallet,'///walet')
 console.log(wallet,'//wallet')
        if (!wallet) {
           // Create wallet for the user
     const newWallet = await Wallet.create({
        user: req.session.userdetails._id,
        balance: 0,
        transactions: [],
        pendingOrder: {
          orderId: "",
          amount: 0,
          currency: ""
        }
      });

      req.session.walletId = newWallet._id;
      return res.redirect('profile');
        }

        // Render the 'user/profile' view with user data, database data, and pagination info
        res.render('user/profile', { datas,wallet, address, userlogin, orders, currentPage: page, totalPages, alertMessage: null });
    } catch (error) {
        console.error('Error fetching profile data:', error);
        res.status(500).send('Internal Server Error');
    }
};





 // post address

const postaddress = async (req, res) => {
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

        res.redirect('/profile'); // Redirect to the user's profile page
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

//edit address
const geteditaddress = async (req, res) => {
    try {
        const data = req.session.userdetails;
       
        // Find all addresses for the user
        const userAddresses = await addressmodel.findOne({ user: req.session.userdetails });

        
       

            // Find the required address using its _id
            const mainaddress = userAddresses.addresses.find(address => address._id.toString() === req.query.id);

          
            
            if (mainaddress) {
                res.render("user/editaddress", { mainaddress });
            } else {
                res.redirect("/profile");
            }
       
    } catch (error) {
        console.error('Error fetching and rendering edit address:', error);
        res.status(500).send('Internal Server Error');
    }
};

//post editaddress

const posteditaddress=async(req,res)=>{
   
    try{
   
        // Find all addresses for the user
        const userAddresses = await addressmodel.findOne({ user: req.session.userdetails });

       
       

            // Find the required address using its _id
            const editaddress = userAddresses.addresses.find(address => address._id.toString() === req.query.id);

           

            if (editaddress) {
                editaddress.firstName = req.body.firstName || editaddress.firstName;
                editaddress.lastName = req.body.lastName || editaddress.lastName;
                editaddress.address = req.body.address || editaddress.address;
                editaddress.phoneNumber = req.body.phoneNumber || editaddress.phoneNumber;
                editaddress.pincode = req.body.pincode || editaddress.pincode;
                editaddress.city = req.body.city || editaddress.city;
                editaddress.state = req.body.state || editaddress.state;
                
                await userAddresses.save();
                res.redirect('/profile')
            }else{
               res.status(404).send('error')
            }

}    catch(error){
    res.status(500).send('Error')
}      

}
//  delete address

const deleteAddress = async (req, res) => {
    try {
        const data = req.session.userdetails._id;
        const addressIdToDelete = req.params.addressId;

        // Delete the specified address from the user's addresses
        const result = await addressmodel.updateOne(
            { user: data },
            { $pull: { addresses: { _id: addressIdToDelete } } }
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



// edit  user account

const posteditaccount = async (req, res) => {
    try {
        const userId = req.session.userdetails._id // Assuming you have a userId in the session
   
        // Retrieve the user from the database based on the userId
        const user = await model.findById(userId);

        if (!user) {
            return res.render('user/profile',{user:null})
        }
       
        // Update the user properties based on the form data
        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

        // Save the updated user object to the database
        await user.save();
  req.session.userdetails=user;
        res.redirect('/profile'); // Redirect to the profile page or any other page after editing
    } catch (error) {
        console.error('Error editing profile:', error);
        res.status(500).send('Internal Server Error');
    }
};

const orderdetails = async (req, res) => {
    try {
        const data = req.params.orderId;
        const productIdTomatch = req.query.productid;

        const orders = await order.findOne({ orderId: data }).populate('products.productId');

        orders.products = orders.products.filter((product) => {
            return product.productId._id.toString() === productIdTomatch; // Use '===' for comparison
        });
        

      

        if (!orders) {
            return res.status(404).send('Order not found');
        }

        res.render('user/orderdetails', { order:orders });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}


const cancelorder = async (req, res) => {
    const { orderId, productId } = req.body;

    try {
        // Find the order by orderId
        const orderproduct = await order.findById(orderId);

        if (!orderproduct) {
            return res.status(404).json({ message: 'Order not found!' });
        }

        // Find the product in the order by productId
        const matchedProduct = orderproduct.products.find(prdct => prdct.productId.toString() === productId);

        if (!matchedProduct) {
            return res.status(404).json({ message: 'Product not found in order!' });
        }

        // Update the status of the matched product to 'cancelled'
        matchedProduct.Status = 'cancelled';
        await orderproduct.save();

        // Retrieve the salesPrice and quantity of the cancelled product
        const salesPrice = matchedProduct.salesPrice;
        const quantity = matchedProduct.quantity;

        // Calculate the total amount for the cancelled product
        const totalAmount = salesPrice * quantity;

        // Check if payment method is razorpay or wallet
        if (orderproduct.paymentMethod === 'razorpay' || orderproduct.paymentMethod === 'wallet') {
            // Add the total amount back to the user's wallet balance
            const userId = orderproduct.userId;
            const wallet = await Wallet.findOne({ user: userId });

            if (!wallet) {
                return res.status(404).json({ message: 'Wallet not found for the user' });
            }

            const transaction = {
                amount: totalAmount,
                description: 'Added money to wallet',
                date: new Date(),
            };

            wallet.transactions.push(transaction);
            wallet.balance += totalAmount;
            await wallet.save();
        }

        return res.status(200).json({ message: 'Product cancelled!' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};





module.exports={
    getprofile,
    postaddress,
    geteditaddress,
    posteditaddress,
    posteditaccount,
    deleteAddress,
    orderdetails,
    cancelorder,
}
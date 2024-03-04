const express=require('express')
const categorymodel = require('../model/categoryschema')
const productmodel = require('../model/productschema')  
const model = require('../model/schema');
const ordermodel=require('../model/orderschema') 
// get login
const getadminlog=async(req,res)=>{
    res.render('admin/login', { alertMessage: null });
}
//  get home
const gethome = async (req, res) => {
    try {
        // Fetch total number of users, products, and orders
        const totalUsers = await model.countDocuments({});
        const totalProducts = await productmodel.countDocuments({});
        const totalOrders = await ordermodel.countDocuments({});

        // Calculate total revenue from delivered orders
        const deliveredOrders = await ordermodel.find({ 'products.Status': 'Delivered' });
        let totalRevenue = 0;
        deliveredOrders.forEach(order => {
            totalRevenue += order.totalAmount;
        });

        // Fetch recent orders
        const recentOrders = await ordermodel.find().sort({ createdAt: -1 }).limit(5).populate('products.productId');

        // Fetch payment method counts
        const razorpayCount = await ordermodel.countDocuments({ paymentMethod: 'razorpay' });
        const codCount = await ordermodel.countDocuments({ paymentMethod: 'cod' });

        // Get the date for five months ago
        const fiveMonthsAgo = new Date();
        fiveMonthsAgo.setDate(1); // Set the date to the 1st of the month
        fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);

        // Initialize arrays to store order counts for each month
        const orderCounts = [];
        const months = [];

        // Use aggregation to group orders by month and count them
        const lastFiveMonthsOrders = await ordermodel.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: fiveMonthsAgo // Start of 5 months ago
                    }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id": 1 } // Sort by date in ascending order
            }
        ]);

        // Iterate over the last five months
        const currentMonth = new Date();
        for (let i = 0; i < 5; i++) {
            // Calculate the month and year
            const month = currentMonth.getMonth() + 1; // Months are 0-indexed, so add 1
            const year = currentMonth.getFullYear();

            // Format the date as "YYYY-MM"
            const formattedMonth = `${year}-${String(month).padStart(2, '0')}`;

            // Find the corresponding count for the month
            const monthOrder = lastFiveMonthsOrders.find(order => order._id === formattedMonth);

            // Add the count of orders for the month to the array, or zero if not found
            orderCounts.push(monthOrder ? monthOrder.count : 0);

            // Add the formatted month to the array
            months.push(formattedMonth);

            // Move to the previous month
            currentMonth.setMonth(currentMonth.getMonth() - 1);
        }

        // Reverse arrays to have the latest month first
        orderCounts.reverse();
        months.reverse();

        // Render the admin home view
        res.render('admin/home', {
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue,
            recentOrders,
            razorpayCount,
            codCount,
            orderCounts,
            months
        });
    } catch (error) {
        console.error('Error fetching home page data:', error);
        res.status(500).send('Internal Server Error');
    }
};





module.exports = { gethome };








const data={
    email:"admin@gmail.com",
    password:"123"
}

//post login

const postlogin=async(req,res)=>{
   
    try{
        const{email,password}=req.body
        if(email===data.email&&password===data.password){
            req.session.admindetails=data
         
        // Render the admin home view with the fetched data
        res.redirect('home');
        }else{
            return res.render('admin/login', { alertMessage: 'Invalid email or password' });
        }
    }catch(error){
        res.status(500).send('invalid')
    }
}



// get users
const ITEMS_PER_PAGE = 10;

const getusers = async (req, res) => {
    try {
        const users = await model.find({});
        
        // Calculate the total number of pages
        const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);

        const page = parseInt(req.query.page) || 1; // Get the requested page from query parameters
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;

        // Slice the array to get the users for the current page
        const paginatedUsers = users.slice(startIndex, endIndex);

        res.render('admin/users', { users: paginatedUsers, currentPage: page, totalPages });
    } catch (error) {
        console.error('Error fetching users', error);
        res.status(500).send('Internal Server Error');
    }
};




//block user


const blockuser= async(req,res)=>{
   
    try{
  
     const {userId}=req.params;
     const user=await model.findById(userId);
 
     if(!user){
         return res.status(404).json({message:"user not found"})
     }
 
     //Toggle the users block status
   
     user.islist=!user.islist;
     await user.save()
     res.status(200).json({ message: "user  updated successfully", islist: user.islist });
 
     
    }catch(error){
     res.status(500).send('intenal server error')
    }
 }

      

 const getorder = async (req, res) => {
     try {
         const page = parseInt(req.query.page) || 1; // Get the requested page from query parameters
 
         // Fetch total count of documents
         const totalOrders = await ordermodel.countDocuments({});
 
         // Calculate total pages
         const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);
 
         // Calculate the starting index for pagination
         const startIndex = (page - 1) * ITEMS_PER_PAGE;
 
         // Fetch orders for the current page using skip and limit
         const orders = await ordermodel.find({})
             .populate('products.productId')
             .populate('userId')
             .skip(startIndex)
             .limit(ITEMS_PER_PAGE);
 
         // Render the view with pagination data
         res.render('admin/order', { data: orders, currentPage: page, totalPages });
     } catch (error) {
         console.error('Error fetching orders', error);
         res.status(500).send('Internal Server Error');
     }
 };
 


  const orderdetails = async (req, res) => {
    try {
        const data = req.params.orderId;
        const productIdTomatch = req.query.productid;

        const orders = await ordermodel.findOne({ orderId: data }).populate('products.productId');

        orders.products = orders.products.filter((product) => {
            return product.productId._id.toString() === productIdTomatch; // Use '===' for comparison
        });
        


        if (!orders) {
            return res.status(404).send('Order not found');
        }

        res.render('admin/orderdetails', { order:orders,productIdTomatch });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}


const updatestatus = async (req, res) => {
    const { orderId, productId, status } = req.body;

    try {
        const order = await ordermodel.findOne({ _id: orderId });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Find the product within the order's products array
        const product = order.products.find(prdct => prdct.productId.toString() === productId);
  
        if (!product) {
            return res.status(404).json({ message: 'Product not found in order' });
        }

        // Update the product's status
        product.Status = status;

        await order.save(); // Save the updated order

        return res.status(200).json({ message: 'Product status updated successfully', order });
    } catch (error) {
        console.error('Error updating product status:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
  };
//  logout

// Logout route
const logout = async (req, res) => {
    // Clear the session or perform any necessary logout actions
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).send("Internal Server Error");
      }
      // Redirect or send a success response
      res.redirect("login"); // Redirect to login page after logout
    });
  };
  



module.exports={
    getadminlog,
    gethome,
    postlogin,
    getusers,
    blockuser,
    getorder,
    orderdetails,
    updatestatus,
    logout,
}
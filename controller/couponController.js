const Coupon = require('../model/couponSchema');

// Get all coupons
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    
    res.render("admin/coupon", { coupons });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Get add coupon form
const getAddCoupon = async (req, res) => {
  res.render("admin/addcoupon", { alertMessage: null });
};

// Create a new coupon
const createCoupon = async (req, res) => {
  try {
    const couponData = {
      code: req.body.code,
      description: req.body.description,
      discountPercentage: req.body.discountPercentage,
      maxDiscountAmount: req.body.maxDiscountAmount,
      minAmount: req.body.minAmount,
    //   maxAmount: req.body.maxAmount,
      expiryDate: req.body.expiryDate
    };

    const couponExist = await Coupon.findOne({ code: couponData.code });
    if (couponExist) {
      return res.render("admin/addcoupon", {
        alertMessage: "Coupon code already exists!"
      });
    }

    const coupon = await Coupon.create(couponData);
    res.redirect("coupon");
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Delete coupon by ID
const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

    if (deletedCoupon) {
      res.status(200).send("Coupon deleted successfully");
    } else {
      res.status(404).send("Coupon not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// Helper function to generate a random alphanumeric coupon code
function generateCouponCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

const getEditCoupon = async (req, res) => {
    try {
        
        const coupon = await Coupon.findOne({ _id: req.query.id });

   
      if (coupon) {
        res.render("admin/editCoupon", { coupon, alertMessage: null });
      }else{
        res.redirect('/coupon')
      }
     
    } catch (error) {
      console.error("Error fetching coupon:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  const postEditCoupon = async (req, res) => {
    try {
      const couponId = req.query.id;
      const coupon = await Coupon.findOne({_id:couponId });
      
      if (!coupon) {
        return res.status(404).send("Coupon not found");
      }
      
      coupon.code = req.body.code || coupon.code;
      coupon.description = req.body.description || coupon.description;
      coupon.discountPercentage = req.body.discountPercentage || coupon.discountPercentage;
      coupon.maxDiscountAmount = req.body.maxDiscountAmount || coupon.maxDiscountAmount;
      coupon.minAmount = req.body.minAmount || coupon.minAmount;
      coupon.maxAmount = req.body.maxAmount || coupon.maxAmount;
      coupon.expiryDate = req.body.expiryDate || coupon.expiryDate;
      
      await coupon.save();
      res.redirect("coupon");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  };

  const blockCoupon = async (req, res) => {
    try {
      const couponId = req.params.Id;
  
      const coupon = await Coupon.findById(couponId);
      
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }
  
      // Toggle the coupon's isList status
      coupon.islist = !coupon.islist;
      await coupon.save();
  
      res.status(200).json({
        message: "Coupon list status updated successfully",
        islist: coupon.islist,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal server error");
    }
  };
  
  
module.exports = {
  getAllCoupons,
  createCoupon,
  deleteCoupon,
  getAddCoupon,
  getEditCoupon,
  postEditCoupon,
  blockCoupon,
};

var express = require("express");
var router = express.Router();
var admin = require("../controller/admincontroller");
const addcategory = require("../controller/add_category");
const addproduct = require("../controller/add_products");
const sales = require("../controller/salesreportcontroller");
const multer = require("multer");
const isAdmin = require("../middlewares/isAdmin");
const path = require("path");
const banner = require("../controller/bannerController");
const couponController = require("../controller/couponController");
const Offer = require("../controller/offerController");

//multer

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/multerimages");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

//admin

// get admin login
router.get("/login",isAdmin.islogedAdmin, admin.getadminlog);
//get admin home
router.get("/home", isAdmin.Admin, admin.gethome);
//post admin login
router.post("/login", admin.postlogin);

//user

//to get users
router.get("/users", isAdmin.Admin, admin.getusers);
// block user
router.post("/blockuser/:userId", isAdmin.Admin, admin.blockuser);

//category

//get categories
router.get("/category", isAdmin.Admin, addcategory.getcategory);
//to get add category
router.get("/addcategory", isAdmin.Admin, addcategory.getaddcategory);
//post addcategory
router.post(
  "/addcategory",
  isAdmin.Admin,
  upload.single("categoryimage"),
  addcategory.postaddcategory
);
//get edit category
router.get("/editcategory", isAdmin.Admin, addcategory.geteditcategory);
//post edir category
router.post(
  "/editcategory",
  isAdmin.Admin,
  upload.single("categoryimage"),
  addcategory.posteditcategory
);
// block category
router.post(
  "/blockcategory/:categoryId",
  isAdmin.Admin,
  addcategory.blockcategory
);

//products

//to get products
router.get("/products", isAdmin.Admin, addproduct.getproducts);
//post addproducts
router.post(
  "/addproducts",
  isAdmin.Admin,
  upload.array("productimage", 4),
  addproduct.postaddproducts
);
//get the  addproducts and add categories into products
router.get("/addproducts", isAdmin.Admin, addproduct.getcategories);
//get edit products
router.get("/editproducts", isAdmin.Admin, addproduct.geteditproduct);
//post edit products
router.post(
  "/editproducts",
  isAdmin.Admin,
  upload.array("productimage", 4),
  addproduct.posteditproduct
);
// block product
router.post("/blockproduct/:productId", addproduct.blockproduct);
// remove image
router.post("/removeImage", addproduct.removeImage);

//orders

router.get("/order", isAdmin.Admin, admin.getorder);
//order details
router.get("/orderdetails/:orderId", isAdmin.Admin, admin.orderdetails);
//updating the  status
router.post("/updatestatus", admin.updatestatus);

//sales report
router.get("/dailyreport", sales.dailyreport);
router.get("/weeklyreport", sales.weeklyreport);
router.get("/yearlyreport", isAdmin.Admin, sales.yearlyreport);
// Route for generating PDF
router.get("/generate-pdf", isAdmin.Admin, sales.pdfDoc);

// Route for generating Excel
router.get("/generate-excel", isAdmin.Admin, sales.excelSheet);

//banner

// Route to get all banners
router.get("/banner", isAdmin.Admin, banner.getAllBanners);
// add banner
router.get("/addbanner", isAdmin.Admin, banner.getAddbanner);

// Route to create a new banner
router.post(
  "/addbanner",
  isAdmin.Admin,
  upload.single("Image"),
  banner.createBanner
);

// GET route to render the edit banner form
router.get("/editbanner", isAdmin.Admin, banner.getEditBanner);

// POST route to handle form submission for editing a banner
router.post(
  "/editbanner",
  isAdmin.Admin,
  upload.single("Image"),
  banner.postEditBanner
);

router.post("/blockBanner/:Id", isAdmin.Admin, banner.blockBanner);
// Route to delete a specific banner by ID
router.delete("/deletebanner/:id", isAdmin.Admin, banner.deleteBanner);

//coupon

// Route to get all coupons
router.get("/coupon", isAdmin.Admin, couponController.getAllCoupons);

// Route to get the add coupon form
router.get("/addcoupon", isAdmin.Admin, couponController.getAddCoupon);

// Route to create a new coupon
router.post("/addcoupon", isAdmin.Admin, couponController.createCoupon);

// Route to delete a coupon by ID
router.delete(
  "/deleteCoupon/:id",
  isAdmin.Admin,
  couponController.deleteCoupon
);
// GET route to render the edit coupon form

router.get("/editCoupon", isAdmin.Admin, couponController.getEditCoupon);

// POST route to handle form submission for editing a coupon
router.post("/editCoupon", isAdmin.Admin, couponController.postEditCoupon);

//block coupon
router.post("/blockCoupon/:Id", isAdmin.Admin, couponController.blockCoupon);

//offer

//prouct offer

router.get("/productOffer", isAdmin.Admin, Offer.getProductOffers);

router.get("/addproductOffer", isAdmin.Admin, Offer.getAddProductOffer);

router.post("/addproductOffer", isAdmin.Admin, Offer.postAddProductOffer);
//delete
router.delete(
  "/deleteproductOffer/:id",
  isAdmin.Admin,
  Offer.deleteProductOffer
);
//get edit product offer
router.get("/editproductOffer", isAdmin.Admin, Offer.geteditproductOffer);

// POST route to handle form submission for editing a productoffer
router.post("/editproductOffer", isAdmin.Admin, Offer.posteditproductOffer);

//block offer
router.post("/blockOffer/:Id", isAdmin.Admin, Offer.blockOffer);

router.get("/logout", admin.logout);
module.exports = router;

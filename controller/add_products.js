const session = require("express-session");
const express = require("express");
const addproduct = require("../model/productschema");
const addcategory = require("../model/categoryschema");
const mongoose = require("mongoose");
const router = express.Router();
const path = require("path");
const multer = require("multer");

// get products

const ITEMS_PER_PAGE = 5; // You can adjust this value based on your preference

const getproducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Get the requested page from query parameters

    const totalProducts = await addproduct.countDocuments({});
    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    const products = await addproduct
      .find({})
      .populate("category")
      .skip(startIndex)
      .limit(ITEMS_PER_PAGE);

    res.render("admin/products", { products, currentPage: page, totalPages });
  } catch (error) {
    console.error("Error fetching products", error);
    res.status(500).send("Internal Server Error");
  }
};

//get add products

const getaddproducts = async (req, res) => {
  // Assuming you want to display a sample alert message
  const alertMessage = "Welcome to the Add Products page!";

  // Pass the alert message to the view
  res.render("admin/addproducts", { alertMessage });
};

const getcategories = async (req, res) => {
  const category = await addcategory.find({});

  res.render("admin/addproducts", { category });
};

const postaddproducts = async (req, res) => {
  const productdata = {
    productimage: req.files.map((images) =>
      images.path.replace(/\\/g, "/").replace("public/", "/")
    ),
    productname: req.body.name,
    category: new mongoose.Types.ObjectId(req.body.category),
    currentqnt: req.body.currentQuantity,
    price: req.body.price,
    description: req.body.description,
    size: req.body.size,
  };

  try {
    const productdetails = await addproduct.create(productdata);

    res.redirect("/admin/products");
  } catch (error) {
    console.error(error); // Log the detailed error
    res.status(500).send("Error");
  }
};

//edit product

const geteditproduct = async (req, res) => {
  try {
    const product = await addproduct.findOne({ _id: req.query.id });

    const category = await addcategory.find({});

    if (product) {
      res.render("admin/editproducts", { product, category });
    } else {
      res.redirect("admin/products");
    }
  } catch (error) {
    console.log(error);
  }
};

const posteditproduct = async (req, res) => {
  try {
    const editedproduct = await addproduct.findOne({ _id: req.query.id });

    if (editedproduct) {
      const existingImages = editedproduct.productimage || [];
      const newImages =
        req.files
          .map((img) => img.path.replace(/\\/g, "/").replace("public/", "/"))
          .slice(0, 4) || [];

      // Concatenate existing and new images
      editedproduct.productimage = existingImages.concat(newImages);

      // Update other fields
      editedproduct.productname =
        req.body.productname || editedproduct.productname;
      editedproduct.category = req.body.category || editedproduct.category;
      editedproduct.currentqnt =
        req.body.currentqnt || editedproduct.currentqnt;
      editedproduct.price = req.body.price || editedproduct.price;
      editedproduct.description =
        req.body.description || editedproduct.description;
      editedproduct.size = req.body.size || editedproduct.size;

      await editedproduct.save();
      res.redirect("/admin/products");
    } else {
      res.status(404).send("Product not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

//block product

const blockproduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await addproduct.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "product not found" });
    }

    //Toggle the users block status

    product.islist = !product.islist;
    await product.save();
    res
      .status(200)
      .json({
        message: "Product list status updated successfully",
        islist: product.islist,
      });
  } catch (error) {
    res.status(500).send("intenal server error");
  }
};

const removeImage = async (req, res) => {
  try {
    const { productId, imageIndex } = req.body;

    const product = await addproduct.findOne({ _id: productId });
    product.productimage.splice(imageIndex, 1);
    product.save();
    res
      .status(200)
      .json({ message: "Image removed successfully", updatedProduct: product });
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  getproducts,
  getaddproducts,
  postaddproducts,
  getcategories,
  geteditproduct,
  posteditproduct,
  blockproduct,
  removeImage,
};

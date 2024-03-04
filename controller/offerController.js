const ProductOffer = require('../model/productOfferSchema');
const session = require("express-session");
const express = require("express");
const addproduct = require("../model/productschema");
const addcategory = require("../model/categoryschema");
const mongoose = require("mongoose");
const router = express.Router();
const path = require("path");



// Controller function to render product offers page
const getProductOffers = async (req, res) => {
  
    try {
      const productOffers = await ProductOffer.find({}).populate("product");
     
      res.render('admin/productOffer', { productOffers });
    } catch (error) {
      console.error("Error fetching product offers", error);
      res.status(500).send("Internal Server Error");
    }
  };




  // Controller function to render add product offer page
  const getAddProductOffer = async (req, res) => {
    
    try {
        // Fetch only products where isSelected is true to populate the dropdown list
        const products = await addproduct.find({ islist: true }, 'productname');
        res.render('admin/addproductOffer', { products, alertMessage: null });
    } catch (error) {
        console.error('Error displaying add product offer form:', error);
        res.status(500).send('Internal Server Error');
    }
};

  
  // Controller function to handle adding a product offer
  const postAddProductOffer = async (req, res) => {
    try {
      
        const productOfferData = {
          offerName: req.body.offerName,
          product: new mongoose.Types.ObjectId(req.body.product),
          discountType: req.body.discountType,
          discountValue: req.body.discountValue,
          startDate: req.body.startDate,
          endDate: req.body.endDate
        };
 
        // Check if the product exists
        const existingProduct = await ProductOffer.findById(productOfferData.product);
        if (existingProduct) {
            res.render("admin/addproductOffer", { alertMessage: "User already exists!" });
        }
    
        // Create the new product offer
        const productOffer = await ProductOffer.create(productOfferData);
        res.redirect('productOffer');
      } catch (error) {
        console.error('Error creating product offer:', error);
        res.status(500).send('Internal Server Error');
      }
  };


  const deleteProductOffer = async (req, res) => {
    try {

      // Extract the offer ID from the request parameters
      const offerId = req.params.id;

      // Use Mongoose to find and remove the product offer with the specified ID
      const deletedOffer = await ProductOffer.findByIdAndDelete(offerId);
  
      // Check if the offer was found and deleted successfully
      if (!deletedOffer) {
        return res.status(404).json({ error: 'Product offer not found' });
      }
      return res.status(200).json({ message: 'Product offer not found' });
      // Redirect the user to the appropriate page after successful deletion
      res.redirect('/admin/productOffers');
    } catch (error) {
      console.error('Error deleting product offer:', error);
      res.status(500).send('Internal Server Error');
    }
  };
  
  const geteditproductOffer = async (req, res) => {
    try {
      const productOffer = await ProductOffer.findOne({ _id: req.query.id });
      const products = await addproduct.find({});
      if (productOffer) {
        res.render("admin/editproductOffer", { productOffer,products });
      } else {
        res.redirect("/admin/productOffer");
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  const posteditproductOffer = async (req, res) => {
    try {
      const editedOffer = await ProductOffer.findOne({ _id: req.query.id });
  
      if (editedOffer) {
        editedOffer.offerName = req.body.offerName || editedOffer.offerName;
        editedOffer.product = req.body.product || editedOffer.product;
        editedOffer.discountType = req.body.discountType || editedOffer.discountType;
        editedOffer.discountValue = req.body.discountValue || editedOffer.discountValue;
        editedOffer.startDate = req.body.startDate || editedOffer.startDate;
        editedOffer.endDate = req.body.endDate || editedOffer.endDate;
  
        await editedOffer.save();
        res.redirect("productOffer");
      } else {
        res.status(404).send("Offer not found");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  

  const blockOffer = async (req, res) => {
    try {
        const offerId = req.params.Id;

        // Find the product offer using the provided ID
        const offer = await ProductOffer.findById(offerId);

        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }

        // Check if the offer is listed
        if (offer.islist === false) { // Check if islist is true
            // Find the associated product using the product ID in the offer
            const product = await addproduct.findById(offer.product);

            // Calculate the discounted amount based on the discount percentage
            const discountAmount = Math.floor(product.price * (offer.discountValue / 100));

            // Update the discountAmount property of the product
            product.discountAmount = discountAmount;

            // Update the product price with the discounted amount
            product.price -= discountAmount;

            // Ensure that the product price is not a decimal number
            product.price = Math.floor(product.price);

            // Save the updated product details
            await product.save();

            // Set islist to false and save the offer
            offer.islist = true;
            await offer.save();

            res.status(200).json({
                message: "Offer is blocked, and product price is updated with discount amount.",
                islist: offer.islist,
            });
        } else { // islist is false
            // Find the associated product using the product ID in the offer
            const product = await addproduct.findById(offer.product);

            // Calculate the original price before discount based on the discountAmount property
            const originalPrice = product.price + product.discountAmount;

            // Update the product price by adding back the discount amount
            product.discountAmount = 0; // Reset the discountAmount
            product.price = originalPrice;

            // Ensure that the product price is not a decimal number
            product.price = Math.floor(product.price);

            // Save the updated product details
            await product.save();

            // Set islist to true and save the offer
            offer.islist = false;
            await offer.save();

            res.status(200).json({
                message: "Offer is unblocked, and product price is updated with original price.",
                islist: offer.islist,
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
};





  module.exports = {
    getProductOffers,
    getAddProductOffer,
    postAddProductOffer,
    deleteProductOffer,
    geteditproductOffer,
    posteditproductOffer,
    blockOffer,
  };
// controllers/bannerController.js
const session = require("express-session");
const express = require("express");
const addcategory = require("../model/categoryschema");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const Banner = require("../model/bannerSchema");
const { log } = require("console");

// Get all banners
const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find();
    res.render("admin/banner", { banners });
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Get add banner form
const getAddbanner = async (req, res) => {
  res.render("admin/addbanner", { alertMessage: null });
};

// Create a new banner
const createBanner = async (req, res) => {
  try {
 
    const bannerData = {
      Title: req.body.Title,
      Image: req.file.path.replace(/\\/g, "/").replace("public/", "/"),
      h2: req.body.h2,
    };
  

    const bannerExist = await Banner.findOne({ title: bannerData.Title });
    if (bannerExist) {
      return res.render("admin/addbanner", {
        alertMessage: "Banner already exists!",
      });
    }

    const banner = await Banner.create(bannerData);
  
    res.redirect("banner");
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Delete banner by ID
const deleteBanner = async (req, res) => {
  try {
    const bannerId = req.params.id;
    const deletedBanner = await Banner.findByIdAndDelete(bannerId);

    if (deletedBanner) {
      res.status(200).send("Banner deleted successfully");
    } else {
      res.status(404).send("Banner not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const getEditBanner = async (req, res) => {
  try {
    const banner = await Banner.findOne({ _id: req.query.id });

    if (banner) {
      res.render("admin/editbanner", { banner, alertMessage: null });
    } else {
      res.redirect("/admin/banner");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const postEditBanner = async (req, res) => {
  try {
    const bannerId = req.query.id;

    const banner = await Banner.findOne({ _id: bannerId });
   
    if (!banner) {
      return res.status(404).send("Banner not found");
    }

    banner.Title = req.body.Title || banner.Title;
    banner.h2 = req.body.h2 || banner.h2;
    banner.Image =
      req.file?.path.replace(/\\/g, "/").replace("public/", "/") ||
      banner.Image;

    await banner.save();
    res.redirect("/admin/banner");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
const blockBanner = async (req, res) => {

  try {
    const bannerId = req.params.Id;

    const banner = await Banner.findById(bannerId);
   
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    // Toggle the banner's isList status
    banner.islist = !banner.islist;
    await banner.save();

    res.status(200).json({
      message: "Banner list status updated successfully",
      isList: banner.isList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
};

module.exports = {
  getAllBanners,
  createBanner,
  deleteBanner,
  getAddbanner,
  getEditBanner,
  postEditBanner,
  blockBanner,
};

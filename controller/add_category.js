const session = require("express-session");
const express = require("express");
const addcategory = require("../model/categoryschema");
const router = express.Router();
const path = require("path");
const multer = require("multer");

// get category
const ITEMS_PER_PAGE = 2; // You can adjust this value based on your preference

const getcategory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Get the requested page from query parameters

    const totalCategories = await addcategory.countDocuments({});
    const totalPages = Math.ceil(totalCategories / ITEMS_PER_PAGE);

    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    const categories = await addcategory
      .find({})
      .skip(startIndex)
      .limit(ITEMS_PER_PAGE);

    res.render("admin/category", { categories, currentPage: page, totalPages });
  } catch (error) {
    console.error("Error fetching categories", error);
    res.status(500).send("Internal Server Error");
  }
};

// get add category

const getaddcategory = async (req, res) => {
  res.render("admin/addcategory", { alertMessage: null });
};

//post addcategory

const postaddcategory = async (req, res) => {
  const categorydata = {
    name: req.body.name,
    description: req.body.description,
    categoryimage: req.file.path.replace(/\\/g, "/").replace("public/", "/"),
  };
  try {
    const categoryexist = await addcategory.findOne({
      name: categorydata.name,
    });
    if (categoryexist) {
      res.render("admin/addcategory", {
        alertMessage: "category already exist!",
      });
    } else {
      categorydetails = await addcategory.create(categorydata);

      res.redirect("/admin/category");
    }
  } catch (error) {
    res.status(404).send("error");
  }
};

//edit category

const geteditcategory = async (req, res) => {
  try {
    const items = await addcategory.findOne({ _id: req.query.id });

    if (items) {
      res.render("admin/editcategory", { items, alertMessage: null });
    } else {
      res.redirect("admin/category");
    }
  } catch (error) {
    console.log(error);
  }
};

const posteditcategory = async (req, res) => {
  try {
    const categoryId = req.query.id;
    const items = await addcategory.findOne({ _id: categoryId });
    const editedcategory = await addcategory.findOne({ _id: categoryId });

    const categoryexist = await addcategory.findOne({
      _id: { $ne: categoryId }, // Exclude the current category from the check
      name: req.body.name,
    });

    if (categoryexist) {
      return res.render("admin/editcategory", {
        alertMessage: "Category already exists!",
        items,
      });
    } else {
      if (editedcategory) {
        editedcategory.name = req.body.name || editedcategory.name;
        editedcategory.description =
          req.body.description || editedcategory.description;
        editedcategory.categoryimage =
          req.file?.path.replace(/\\/g, "/").replace("public/", "/") ||
          editedcategory.categoryimage;
        await editedcategory.save();
        res.redirect("/admin/category");
      } else {
        res.status(404).send("Category not found");
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

//block category

const blockcategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await addcategory.findById(categoryId);

    if (!category) {
      return res.status(404).json({ message: "category not found" });
    }

    //Toggle the users block status

    category.islist = !category.islist;
    await category.save();
    res.status(200).json({
      message: "category  updated successfully",
      islist: category.islist,
    });
  } catch (error) {
    res.status(500).send("intenal server error");
  }
};

module.exports = {
  getcategory,
  getaddcategory,
  postaddcategory,
  geteditcategory,
  posteditcategory,
  blockcategory,
};

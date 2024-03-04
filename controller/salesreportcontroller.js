const express = require("express");
const model = require("../model/schema");
const productmodel = require("../model/productschema");
const addressmodel = require("../model/addressSchema");
const Order = require("../model/orderschema");
const bcrypt = require("bcrypt");
const session = require("express-session");
const PDFDocument =require('pdfkit-table'); // This line is necessary to extend PDFKit with table functionality


const excelJS = require('exceljs');
const fs=require('fs')
const doc = new PDFDocument();


const dailyreport = async (req, res) => {
  const data = await Order
    .find({ "products.Status": "Delivered" })
    .populate("products.productId");
  res.render("admin/dailyreport", { data });
};

const weeklyreport = async (req, res) => {
  const data = await Order
    .find({ "products.Status": "Delivered" })
    .populate("products.productId");
  res.render("admin/weeklyreport", { data });
};

const yearlyreport = async (req, res) => {
  try {
    // Get start and end dates from request query parameters
    const { startDate, endDate } = req.query;

    let startOfRange, endOfRange;

    // If no start date provided, set it as the date of the first order
    if (!startDate) {
      const firstOrder = await Order.findOne({}, {}, { sort: { 'date': 1 } });
      startOfRange = firstOrder ? firstOrder.date : new Date();
    } else {
      startOfRange = new Date(startDate);
    }

    // If no end date provided, set it as today's date
    if (!endDate) {
      endOfRange = new Date();
    } else {
      endOfRange = new Date(endDate);
    }

    // Assign start and end dates to session for later use in PDF and Excel downloads
    req.session.startDate = startOfRange;
    req.session.endDate = endOfRange;

    // Fetch orders with 'Delivered' status and within the specified date range
    const data = await Order.find({
      "products.Status": "Delivered",
      date: { $gte: startOfRange, $lte: endOfRange }
    }).populate("products.productId");

    // Render the yearly report view with the filtered data
    res.render("admin/yearlyreport", { data });
  } catch (error) {
    console.error("Error fetching yearly report data:", error);
    res.status(500).send("Internal Server Error");
  }
};


// Function to generate PDF document
const pdfDoc = async (req, res, next) => {
  try {
 
   const start_date = req.session.startDate ;
    const  end_date =  req.session.endDate;    

    const orders = await Order.find({
      "products.Status": "Delivered",
      date: { $gte: start_date, $lte: end_date }
    }).populate("products.productId");


      const doc = new PDFDocument();
      const filename = 'orders.pdf';
      res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
      doc.pipe(res);

      doc.fontSize(20).text('Orders', { align: 'center' });
      doc.moveDown(2);
      doc.moveDown(1);

      const table = {
          headers: ['Order ID', 'Product', 'Quantity', 'Total'],
          rows: []
      };

      orders.forEach((order) => {
        order.products.forEach((product) => {
            table.rows.push([
                order.orderId.slice(-6),
                product.productId.productname,
                product.quantity.toString(),
                '₹' + product.salesPrice.toFixed(2)
            ]);
        });
    });

      doc.table(table, {
          width: 600,
          headerLines: 1,
          align: 'center',
      });

      doc.end();
  } catch (error) {
      // Handle error
      console.error(error);
      next(error)
  }
};






// Function to generate Excel sheet
const excelSheet = async (req, res, next) => {
  try {
      const start_date = req.session.startDate;
      const end_date = req.session.endDate;


        const orders = await Order.find({
      "products.Status": "Delivered",
      date: { $gte: start_date, $lte: end_date }
    }).populate("products.productId");

      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');

      worksheet.columns = [
          { header: 'Order ID', key: 'orderId', width: 15 },
          { header: 'Product Name', key: 'productName', width: 40 },
          { header: 'Quantity', key: 'quantity', width: 15 },
          { header: 'Total', key: 'total', width: 15 },
      ];

      orders.forEach(order => {
          order.products.forEach(product => {
              worksheet.addRow({
                  orderId: order.orderId.slice(-6),
                  productName: product.productId.productname,
                  quantity: product.quantity,
                  total: '₹' + product.salesPrice.toFixed(2)
              });
          });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');

      await workbook.xlsx.write(res);
  } catch (error) {
      console.error('Error generating Excel:', error);
      next(error);
  }
};




module.exports = { 
  dailyreport,
   weeklyreport,
    yearlyreport ,
    pdfDoc,
     excelSheet  };

// models/banner.js

const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    Title: {
        type: String,
        required: true
    },
    h2: {
        type: String,
        
    },
    Image: {
        type: String,
     
    },
   


    islist:{
        type:Boolean,
        default:true
    }
});

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;

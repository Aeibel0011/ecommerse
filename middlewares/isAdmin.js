const Admin = (req, res, next) => {
  if (req.session.admindetails) {
    next();
  } else {
    res.redirect("login");
  }
};


const islogedAdmin=(req,res,next)=>{
  if(req.session.admindetails){
    res.redirect('home')
  }else{
    next();
  }
}

module.exports = {
  Admin,
  islogedAdmin,
};

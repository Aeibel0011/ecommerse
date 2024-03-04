const checksession = (req, res, next) => {
  if (req.session.userdetails) {
    next();
  } else {
    res.redirect("/login");
  }
};



const isloged=(req,res,next)=>{
  if(req.session.userdetails){
    res.redirect('/')
  }else{
    next();
  }
}



module.exports = {
  checksession,
  isloged
};


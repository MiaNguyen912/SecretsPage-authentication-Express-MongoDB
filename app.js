require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption"); //level 2 
// const md5 = require("md5"); //level 3
// const bcrypt = require("bcrypt"); //level 4
// const saltRounds = 10; //level 4
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose'); 


const app = express();
//---------------------

//middleware use
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
  secret: 'thisIsOutSecret.',
  resave: false,
  saveUninitialized: false,
}))
app.use(passport.initialize()); //initialize passport
app.use(passport.session()); //use passport to manage our session (since login to logout)

//----------------------

//connect to database
mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});
userSchema.plugin(passportLocalMongoose);

// plugin the secret string into schema (level 2)
// userSchema.plugin(encrypt, { secret: process.env.SECRET_STRING, encryptedFields: ['password'] });  

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser()); //serialize and deserialize are only useful while we use session
                                              //serialize creates a cookie to store users identifications
passport.deserializeUser(User.deserializeUser()); //deserialize allows passport to discover the message inside cookie to see users identifications


//----------------------

//APIs
app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secrets", (req, res) =>{
  if(req.isAuthenticated()) {
    res.render("secrets")
  }
  else res.redirect("/login");
})

app.get("/logout", (req, res)=>{
  req.logout((err)=>{
    if(err) return next(err)
  });
  res.redirect("/");
})

app.post("/register", async (req, res)=>{
  try{
    //create user date
    const activeUser = await User.register({username:req.body.username}, req.body.password);
    //activeUser will be a record written in database (an obj containing _id, username, salt, hash)

    passport.authenticate("local")(req, res, ()=> {  //give authentication until session ends (when we close tab or browser)
      res.redirect("/secrets")
    })

  } catch( err){ //error can be username already exist
    res.redirect("/register"); 
  }
  

});

app.post("/login", async(req, res)=>{
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, (err) =>{
    if (err) console.log(err)
    else {
      passport.authenticate("local")(req, res, ()=> {  
        res.redirect("/secrets")
      })
    }
  })

});






//----------------------

//host on local port
app.listen(3000, function() {
  console.log("Server started on port 3000.");
});

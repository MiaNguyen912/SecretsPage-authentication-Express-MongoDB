require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption"); //level 2 
const md5 = require("md5"); //level 3

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
//----------------------

//connect to database
mongoose.connect("mongodb://localhost:27017/userDB");

// const userSchema = new { 
//   email: String,
//   password: String
// };

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// plugin the secret string into schema (level 2)
// userSchema.plugin(encrypt, { secret: process.env.SECRET_STRING, encryptedFields: ['password'] });  

const User = new mongoose.model("User", userSchema);

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

app.post("/register", async(req, res)=>{
  const newUser =  new User({
    // email: req.body.username,
    // password: req.body.password
    email: req.body.username,
    password: md5(req.body.password) //change password into an irreversible string using md5 hash
  });
  try{
    await newUser.save();
    res.render("secrets");
  } catch(err){console.log(err);}

});

app.post("/login", async(req, res)=>{
  const username = req.body.username;
  const password = md5(req.body.password);  //change is into the md5 string and compared with stored md5 string in database
  try{
    const foundUser = await User.findOne({email: username})
    if(foundUser) {
      if (foundUser.password === password){
        res.render("secrets");
      } else {
        res.send("Incorrect password");
      }
    } else {
      res.send("Username does not exist.")
    }
  } catch(err){console.log(err)}
});






//----------------------

//host on local port
app.listen(3000, function() {
  console.log("Server started on port 3000.");
});

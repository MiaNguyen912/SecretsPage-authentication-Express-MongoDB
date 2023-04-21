require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const bcrypt = require("bcrypt"); //level 4
// const saltRounds = 10; //level 4
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy; //google connect
const findOrCreate = require('mongoose-findorcreate');
const FacebookStrategy = require('passport-facebook'); //facebook connect

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
  username: String,
  password: String,
  googleId: String,  //add this field to schema
  facebookId: String,
  secret: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());

//----------------------------

//serialize - deserialize (for user active session)
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

//---------------------------

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets", //Authorized redirect URIs
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo" //this line fix Google+ deprecation
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile)  //to see profile info

    //find or create new record in database based off the 'googleID' field
    //thus, we need to add the 'googleID' field into out mongoose Schema
    //(originally we only have the 'username', 'password' field)
    User.findOrCreate({username: profile.displayName, googleId: profile.id }, function (err, user) { 
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile)
    User.findOrCreate({username: profile.displayName, facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//----------------------

//APIs
app.get("/", function(req, res){
  res.render("home");
});
  //-------------------------

  //authenticate requests google, facebook
app.get("/auth/google",
  passport.authenticate("google", { scope: ['profile', 'email'] }) //use passport to authenticatie users on google's server
  //this line will bring a pop up for users to sign in into their google account and will get their profile
  //What you will get in profile response: id, name, pictures, email
)

app.get('/auth/google/secrets',  //Authorized redirect URIs
  passport.authenticate('google', { failureRedirect: '/login' }), //authenticate locally and save their login session
  function(req, res) {
    res.redirect('/secrets');     // Successful authentication, redirect to secrets page.
});

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
  //-------------------------

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secrets", (req, res) =>{
  // if(req.isAuthenticated()) {
  //   res.render("secrets")
  // }
  // else res.redirect("/login");
  User.find({"secret": {$ne: null}}).then((foundUsers)=>{ //not equal to null
    if(foundUsers) res.render("secrets", {usersWithSecrets: foundUsers})
  })  
})

app.get("/submit", (req, res)=>{
  if(req.isAuthenticated()) {
    res.render("submit")
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
    //create user data
    const registeredUser = await User.register({username:req.body.username}, req.body.password);
    //registeredUser will be a record written in database (an obj containing _id, username, salt, hash)

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

app.post("/submit", (req, res)=>{
  const submittedSecret = req.body.secret;
  // console.log(req.user) //when we initiate a login session, passport saves the user detail written in database
  User.findById(req.user.id).then((foundUser)=>{
    if(foundUser) foundUser.secret = submittedSecret;
    foundUser.save().then(()=>{
      res.redirect("/secrets");
    })
  })

})





//----------------------

//host on local port
app.listen(3000, function() {
  console.log("Server started on port 3000.");
});

//OAuth Google

require("dotenv").config() //Require it as early as possible and perform config method.
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require ("passport");
const session = require ("express-session");
const passportLocalMongoose = require ("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy; //Require passport-google-oauth20.
const findOrCreate = require ("mongoose-findorcreate")  //Requiring findOrCreate


//No need to require passport-local.



const app = express();

app.use(express.static("public"))

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

const oneDay = 1000 * 60 * 60 * 24;

app.use(session({   //Letting express use express-session.
  secret: "My big secret",
  resave: false,
  cookie: { maxAge: oneDay },  //Cookies will last for one day
  saveUninitialized: false
}))

app.use(passport.initialize());  //we are initilaizing passport
app.use(passport.session());     //We are telling passport to use session.

mongoose.connect("mongodb://localhost:27017/user1DB")

const userSchema = new mongoose.Schema({ //Must use the complete mongoose schema form
  email: String,
  password: String,
  googleId: String //This will save somoene's google ID if they use google to sign in.
})

userSchema.plugin(passportLocalMongoose);  //We are gonna use this to hash and salt password and save user to our mongoDB database.
userSchema.plugin(findOrCreate) //Letting userSchema access findOrCreate


const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {   //This is from passport ,and it will work for all kind of Strategy.
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


//Now we gonna configure the OAuth file.

//Place it after serialize and deserializering.

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,  //Importing the Client_ID from env file that we got from google
    clientSecret: process.env.CLIENT_SECRET,  //Importing the Client_Secret from env file that we got from google
    callbackURL: "http://localhost:3000/auth/google/secrets",  // The url google will redirect to after loggin in.
    // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",  //Since G+ is no more,it will click into user details.

  },
  function(accessToken, refreshToken, profile, cb) {  //This function will run after using google account from signup from.
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {  //This will either find or create a new user.
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res) {
  res.render("home")
})


app.get("/auth/google",
  passport.authenticate("google", { scope: ['profile'] }));  //After redirecting to this page passport will run its function to sign up users using goodle.

  app.get("/auth/google/secrets",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function(req, res) {
      // Successful authentication, redirect to secrets.
      res.redirect("/secrets");
    });

app.get("/login", function(req, res) {

  if(req.isAuthenticated()){
    res.redirect("/secrets")  //If the user is already logged in,will redirect to secret page.
  } else {
    res.render("login")
  }

})

app.get("/register", function(req, res) {
  res.render("register")
})

app.get("/secrets",function(req,res) {
  if(req.isAuthenticated()) {  //We are checking if the user is authenticated.
    res.render("secrets")
  } else {
    res.redirect("/login")    //If they are not ,we will redirect the to login page.
  }
})

app.get("/logout",function(req,res) {
  req.logout();  //Its a passport method to logout user.
  res.redirect("/")
})

app.post("/register", function(req, res) {

User.register({username: req.body.username},req.body.password,function(err,user){  //This package comes from passportLocalMongoose.
   if(err) {
     console.log(err);
     res.redirect("/register")  //If there was any error,we will redirect the user to Register Page.

   } else {
     passport.authenticate("local") (req,res,function() {  //Will authenticate user using passport.
       res.redirect("/secrets");
     })
   }
})

});

app.post("/login", function(req, res) {


  const user = new User ({
    username: req.body.username,
    password: req.body.password
  })

   req.login(user,function(err) {
     if(err) {
       console.log(err);
     } else {
       passport.authenticate("local") (req,res,function() {  //Will authenticate user using passport.
         res.redirect("/secrets");
       })
     }
   })

});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});

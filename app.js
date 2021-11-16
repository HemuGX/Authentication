//Enviromental Variables

require("dotenv").config()  //Require it as early as possible and perform config method.
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");


const app = express();

app.use(express.static("public"))

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/user1DB")

const userSchema = new mongoose.Schema ({ //Must use the complete mongoose schema form
  email: String,
  password: String
})

//Create .env file on root folder.And put it in gitignore.

// const secret = "trulyNotASecureKey"

userSchema.plugin(encrypt,{secret: process.env.SECRET, encryptedFields: ["password"]}) ////Do it before announcing model.

const User = mongoose.model("User",userSchema);

app.get("/home",function(req,res) {
  res.render("home")
})

app.get("/login",function(req,res) {
  res.render("login")
})

app.get("/register",function(req,res) {
  res.render("register")
})

app.post("/register",function(req,res) {
  const newUser = new User ({
    email: req.body.username,
    password: req.body.password,
  })

  newUser.save(function(err){  //This will save user information to Dataase.
    if(!err) {
      res.render("secrets")   //If the registration was successfull ,the secret page will render,There is no oher way to render it cauz there is no get requesrt.
    }
  })
});

app.post("/login",function(req,res) {
  userEmail = req.body.username;
  userPassword = req.body.password;

  User.findOne({email: userEmail},function(err,foundUser) {
    if(!err) {
      if(foundUser){  //This will check if the user was found.
        if(foundUser.password === userPassword ){  //This will check if the password matched.
          res.render("secrets")
        }
      }
    }
  });
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});

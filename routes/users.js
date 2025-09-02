const mongoose = require("mongoose");
const plm = require('passport-local-mongoose');

mongoose.connect("mongodb+srv://kabeerahmed0120:kabeerahmed0120@cluster0.3hluiqs.mongodb.net/");

const userSchema = mongoose.Schema({
  username:String,
  name:String,
  email:String,
  password:String,
  profileImage:String,
  contact:Number,
  board:{
    type: Array,
    default: []
  },
  posts:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: "post"
},]
});

userSchema.plugin(plm);


module.exports = mongoose.model("user", userSchema);
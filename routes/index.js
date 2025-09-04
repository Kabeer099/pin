var express = require("express");
var router = express.Router();
const { body, validationResult } = require("express-validator");
const userModel = require("./users");
const postModel = require("./post");
const passport = require("passport");
const upload = require("./multer");
const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
 router.get("/", isNotLoggedin, function (req, res, next) {
  res.render("index", { nav: false });
}) ;

/* GET Register page. */
router.get("/register",isNotLoggedin, function (req, res, next) {
  res.render("register", { nav: false });
});
/* profile image upload. */
router.post("/fileupload", isLoggedin, upload.single("image"), async function (
  req,
  res,
  next
) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect("/profile");
});

/* GET profile page. */
router.get("/profile", isLoggedin, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate("posts");
  res.render("profile", { user, nav: true });
});
/* GET all Post page. */
router.get("/show/posts", isLoggedin, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate("posts");
  res.render("show", { user, nav: true });
});
/* GET a single Post. */
/* GET a single Post. */
router.get("/show/posts/:id", isLoggedin, async function (req, res, next) {
  try {
    const postId = req.params.id;

    // 1) Current post + user
    const post = await postModel.findById(postId).populate("user");
    if (!post) return res.status(404).send("Post not found");

    // 2) 4–5 random posts (current post ko exclude)
    let randomPosts = [];
    try {
      randomPosts = await postModel.aggregate([
        { $match: { _id: { $ne: post._id } } },
        { $sample: { size: 5 } },
      ]);
    } catch (err) {
      console.error("Error fetching random posts:", err);
      randomPosts = []; // fallback
    }

    // 3) View ko sab variables pass karo
    res.render("singlepost", { post, randomPosts, nav: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

/* GET feed page. */
router.get("/feed", isLoggedin, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate("posts");
  const posts = await postModel.find();
  res.render("feed", { user, posts, nav: true });
});

/* post page. */
router.get("/addpost", isLoggedin, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render("add", { user, nav: true });
});

/* post upload*/
router.post("/createpost", isLoggedin, upload.single("postimage"),async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const post = await postModel.create({
    user: user._id,
    title : req.body.title,
    description : req.body.description,
    image:req.file.filename
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});


/* Post Register data. */
router.post("/register", function (req, res, next) {
  const data = new userModel({
    username: req.body.username,
    email: req.body.email,
    contact: req.body.contact,
    name: req.body.fullname,
  });
  userModel.register(data, req.body.password).then(function (registereduser) {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

/* GET Edit profile page. */
router.get("/edit-profile", isLoggedin, async function (req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    res.render("edit", { user, nav: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/update-profile", isLoggedin, async function (req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });

    // Update user information based on the submitted form data
    user.username = req.body.username;
    user.email = req.body.email;
    user.contact = req.body.contact;
    user.name = req.body.fullname;

    await user.save();

    res.redirect("/profile"); // Redirect to the profile page after updating
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


/* login route. */

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/",
  }),
  function (req, res, next) {}
);

/* logout. */

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});


/* POST Delete a post. */
router.post("/delete-post/:postId", isLoggedin, async function (req, res, next) {
  try {
    const postId = req.params.postId;

    // Check if the post exists
    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).send("Post not found");
    }

    // Check if the user is the owner of the post
    if (post.user.equals(req.user._id)) {
      // If the user owns the post, delete it
      await postModel.findOneAndDelete({ _id: postId });

      // Remove the post ID from the user's posts array
      const user = await userModel.findById(req.user._id);
      user.posts = user.posts.filter(id => !id.equals(postId));
      await user.save();

      // Redirect back to the post page or any other desired page
      return res.redirect("/show/posts");
    } else {
      // If the user is not the owner, handle accordingly (e.g., show an error page)
      return res.status(403).send("Permission denied. You don't have the right to delete this post.");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});


/* isLoggedin Middleware*/
function isLoggedin(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}
function isNotLoggedin(req, res, next) {
  if (!req.isAuthenticated()) {
    // If the user is not authenticated, allow them to proceed
    return next();
  }
  // If the user is authenticated, redirect them to their profile page
  return res.redirect("/profile");
}

module.exports = router;

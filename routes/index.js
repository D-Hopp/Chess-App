var express = require('express');
var router = express.Router();
var path = require('path')

//GET home page. 
router.get('/', function(req, res, next) {
  const username = req.session?.auth ? req.session.user?.name : ''
  console.log(username)
  res.render('index', {script: "index", username: username});
  next()
});

router.post('/', function(req, res, next){
  res.send()
})

module.exports = router;

/**
 * Module dependencies.
 */


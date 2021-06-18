var express = require('express');
 var hash = require('pbkdf2-password')()
 var path = require('path');
 const User = require('../models/user')

 
 var router = module.exports = express.Router();

router.get('/', function(req, res, next) {
  console.log(req.session)
  res.send()
})

router.post('/', async function (req, res) {
  //
  // "Log in" user and set user as session.
  //
  let user
  res.auth = true
  let body = req.body

  if(body == null) {
    return res.status(400).send('Bad input')
  }
  console.log(body.user)
  try {
    user = await User.findOne({name: body.user?.name})
    if (user == null){
      return res.status(404).send('User not found')
    }
    if (user?.password) {
      res.auth = false
      if(user.password == body.user?.password) {
        res.auth = true
      }
    }
  } catch (error) {
    return res.status(500).send(error.message)
  }

  if (res.auth) {
    req.session.user = user
    req.session.auth = true
    req.session.success = "session established"
    try {
      user.last_login = Date.now()
      await user.save()
    } catch (error) {
      console.log(error)
    }
    res.send({username: user.name})
  } else {
    res.status(500).send('Wrong password')
  }

})

router.put('/', async function (req, res) {
  // Register User by associating a password to a User without a password, or 

  let user
  res.auth = true
  let body = req.body
  //TODO Validate input
  if(body == null) {
    console.log("null")
    return res.status(400).send(error.message)
  }
  try {
    user = await User.findOne({name: body.user?.name})
    if (user == null){
      user = new User({name: body.user?.name, password: body.user?.password}) //TODO Hash Password
      try {
        const newUser = await user.save()
      } catch (error) {
        console.log(error)
        return res.status(400).send(error.message)
      }
    }
    if (user?.password) {
      res.auth = false
    } else {
      user.password = body.user?.password
      try {
        const newPassword = await user.save()
      } catch (error) {
        console.log(error)
        return res.status(500).send(error.message)
      }
    }
  } catch (error) {
    return res.status(500).send(error.message)
  }

  if (res.auth) {
    req.session.user = user
    req.session.auth = true
    req.session.success = "session established"
    try {
      user.last_login = Date.now()
      await user.save()
    } catch (error) {
      console.log(error)
    }
    res.send({username: user.name})
  } else {
    res.status(500).send('User already registered')
  }
})

router.delete('/', function (request, response) {
  const ws = map.get(request.session.userId);

  console.log('Destroying session');
  request.session.destroy(function () {
    if (ws) ws.close();

    response.send({ result: 'OK', message: 'Session destroyed' });
  });
});
 
//  // config
 
//  //app.set('view engine', 'ejs');
//  //app.set('views', path.join(__dirname, 'views'));
 
//  // middleware
 

 
//  // dummy database
 
//  var users = {
//    tj: { name: 'tj' }
//  };
 
//  // when you create a user, generate a salt
//  // and hash the password ('foobar' is the pass here)
 
//  hash({ password: 'foobar' }, function (err, pass, salt, hash) {
//    if (err) throw err;
//    // store the salt & hash in the "db"
//    users.tj.salt = salt;
//    users.tj.hash = hash;
//  });
 
 
//  // Authenticate using our plain-object database of doom!
 
//  function authenticate(name, pass, fn) {
//    console.log('authenticating %s:%s', name, pass);
//    var user = users[name];
//    // query the db for the given username
//    if (!user) return fn(new Error('cannot find user'));
//    // apply the same algorithm to the POSTed password, applying
//    // the hash against the pass / salt, if there is a match we
//    // found the user
//    console.log("hash now")
//    hash({ password: pass, salt: user.salt }, function (err, pass, salt, hash) {
//      if (err) return fn(err);
//      if (hash === user.hash) return fn(null, user)
//      fn(new Error('invalid password'));
//    });
//  }
 

//  router.get('/', function(req, res, next){
//   console.log("get")
//   res.send()
// })
// router.post('/', function(req, res, next){
//   authenticate(req.body.user.name, req.body.user.password, function(err, user){
//     if (user) {
//       // Regenerate session when signing in
//       // to prevent fixation
      
//       req.session.regenerate(function(){
//         // Store the user's primary key
//         // in the session store to be retrieved,
//         // or in this case the entire user object
//         req.session.user = user;
//         req.session.success = 'success'
//         res.send(user);
//         next()
//       });
//     } else {
//       console.log(res.headers)
//       req.session.error = 'error'
//       res.send('back');
//     }
//   });
// })

var express = require('express');
var router = express.Router();
const User = require('../models/user')

/* GET users listing. */
router.get('/', async function(req, res, next) {
  try{
    const users = await User.find()
    res.json(users)
  } catch (error){
    res.status(500).send(error.message)
  }
});

router.get('/:name', getUser, function(req, res, next){
  let userstats = res.user
  res.user = null
  res.status(201).render('users', {script: "user", name: req.params.name, username: req.session?.user.name, auth: req.params.name==req.session?.user.name, games_played: userstats?.games_played, games_won: userstats?.games_won, last_login: userstats?.last_login})
})

router.post('/', async function(req, res, next){
  // TODO VALIDATE UNIQUE USER
  const user = new User({
    name: req.body.user?.name,
    password: req.body.user?.password,
  })
  try {
    const newUser = await user.save()
    res.status(201).render(path.join(__dirname, '../views/users'), {script: "user", username: newUser.name})
  } catch (error) {
    res.status(400).send(error.message)
  }
})

router.patch('/:name', function(req, res, next){
  res.send('patch')
})

router.delete('/', async function (req, res, next) {
  try {
    await User.deleteMany()
    res.status(202).json("Reset Database")
  } catch (error) {
    res.status(500).send(error.message)
  }
})

async function getUser(req, res, next) {
  let user
  res.auth = true
  try {
    user = await User.findOne({name: req.params.name})
    if (user == null){
      user = new User({name: req.params.name, password: ''})
      try {
        const newUser = await user.save()
      } catch (error) {
        res.status(400).send(error.message)
      }
    }
    if (user?.password) {
      res.auth = false
      if (req.session?.user.name == user.name) {
        res.auth = true
      }
    }
  } catch (error) {
    return res.status(500).send(error.message)
  }
  if (res.auth) {
    req.session.user = user
    req.session.success = "session established"
    try {
      user.last_login = Date.now()
      await user.save()
    } catch (error) {
      console.log(error)
    }
  }
  res.user = user
  next()
}


module.exports = router;

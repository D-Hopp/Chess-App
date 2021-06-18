var express = require('express');
var router = express.Router();
const Room = require('../models/room')
const User = require('../models/user')

//Debug
router.get('/', async function(req, res, next) {
  try{
    const users = await Room.find()
    res.json(users)
  } catch (error){
    res.status(500).send(error.message)
  }
});

//GET room by name
router.get('/:name', getRoom, getUser, function(req, res, next) {
  console.log("room requested")
  console.log(req.session.user.name)
  res.status(201).render('room', {script: "room", player1: res.player1.name, player2: res.player2.name, user: req.session.user, username: req.session.user.name})
})

//Debug
router.post('/:tablename/:player1/:player2', async function(req, res, next) {
  try{
    let room = new Room({
      name: req.params.tablename,
      player1: await User.findOne({name: req.params.player1}),
      player2: await User.findOne({name: req.params.player2}),
    })
    try {
      const newRoom = await room.save()
    } catch (error) {
      res.status(500).send(error.message)
    }
  res.status(200).json(room)
  } catch (error) {console.error(error); res.status(500).send(error.message)}

})
//Debug
router.delete('/', async function (req, res, next) {
  try {
    await Room.deleteMany()
    res.status(202).json("Reset Database")
  } catch (error) {
    res.status(500).send(error.message)
  }
})


async function getRoom(req, res, next) {
  let room
  console.log(req.params.name)
  try {
    room = await Room.findOne({name: req.params.name})
    player1 = await User.findById(room.player1)
    player2 = await User.findById(room.player2)
    console.log(room)
    if (room == null){
      
        return res.status(404).send("room not found")
      
    }
  } catch (error) {
    return res.status(500).send(error.message)
  }
  res.room = room
  res.player1 = player1
  res.player2 = player2
  next()
}

async function getUser(req, res, next) {
  if(!req.session?.user){
    let user
    try {
      user = await User.findOne({name: 'anonymous'})
      if (user == null){
        user = new User({name: 'anonymous'})
        try {
          const newUser = await user.save()
        } catch (error) {
          res.status(400).send(error.message)
        }
      }
    } catch (error) {
      return res.status(500).send(error.message)
    }
    req.session.user = user
    req.session.success = "session established"
    try {
      user.last_login = Date.now()
      await user.save()
    } catch (error) {
      console.log(error)
    }
  }
  console.log("Generating anon spectator: "+req.session.user.name)
  next()
}

module.exports = router;
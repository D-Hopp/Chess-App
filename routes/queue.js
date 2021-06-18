var express = require('express');
const Room = require('../models/room')
const User = require('../models/user')
const uuid = require('uuid')

 
 var router = express.Router();

 var queue = []

function restrict(req, res, next) {    
    if (req.session.user) {
      next()
    } else {
      req.session.error = 'Access denied!';
      res.send('Login');
      console.log("api/-")
    }
  }
  router.get('/', restrict, async function(req, res, next){
    if (req.session.user){
      const olduser = req.session.user
        if(!queue.find(element => element._id==olduser._id)){
          
          try{
            //User in multiple Rooms is bad
            const player1 = await Room.findOne({player1: olduser})
            const player2 = await Room.findOne({player2: olduser})
            if(player1) {
              return res.json({url: `/room/${player1.name}`})
            }
            if(player2) {
              return res.json({url: `/room/${player2.name}`})
            }
            res.json({queued: false})   //race condition room destroyed before joined
          } catch (error) {console.log(error.message);res.status(505).send(error.message)}
          
        } else {
          console.log("still queued")
          res.json({queued: true})
        }
    } else {
      console.log("no session found")
      res.status(401).json({queued: false})
    }
  })

  router.post('/', restrict, async function(req, res, next) {
      if (req.session.user){
          const newuser = req.session.user
          if (queue[0] && !queue.find(element => element._id==newuser._id)){
            //User might already be in a game
             //Deleting User while queued might be bad
             try{
              let room = new Room({
                name:  uuid.v4(),
                player1: await User.findById(newuser._id),
                player2: await User.findById(queue[0]._id), 
              })
              try {
                const newRoom = await room.save()
              } catch (error) {
                console.log(error)
                return res.status(504).send(error.message)
              }
              queue.shift()
              console.log(`room created: ${room.name}`)
              res.json({url: `/room/${room.name}`})
            } catch (error) {console.error(error); res.status(500).send(error.message)}
          } else {
            
            queue.push(req.session.user)
            console.log(`queued user: ${queue[0].name}`)
            res.json({queued: true})
          }
        
      } else {
        console.log("no session found")
          res.status(401).json({queued: false})
      }
  })


  module.exports = router
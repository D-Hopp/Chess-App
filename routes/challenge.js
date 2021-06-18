var express = require('express');
const Room = require('../models/room')
const User = require('../models/user')
const uuid = require('uuid');

 
 var router = express.Router();

 var challenges = new Map()
 var challengers = new Map()
 var acceptedChallenges = new Map()

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
      const updater = req.session.user
      if (acceptedChallenges.get(updater._id)) {
        try {
          return res.json({url: `/room/${acceptedChallenges.get(updater._id)}`})
        } catch (error) {console.error(error); res.status(500).send(error.message)}
      }

      let resObject = {}
      if(challengers.get(updater._id)) {
        try {
          const user = await User.findById(challengers.get(updater._id))
          resObject.challenges = user.name
        } catch (error) {
          console.log(error)
        }
      }
      
      if(challenges.get(updater._id)) {
        try {
          let names = []
          
          for(challenger of challenges.get(updater._id)) {
            const id = challenger._id
            const user = await User.findById(id)
            names.push(user?.name)
          }
          resObject.names = names
        } catch (error) {
          console.log(error)
        }
      }
      res.json({data: resObject})
    }
  })

  router.post('/', restrict, async function(req, res, next) {
    let body = req.body
    if(body == null) {
      return res.status(400).json({error: 'Bad input'})
    }
      if (req.session.user){
          const challenger = req.session.user
          if(challengers.get(challenger._id)) {
              return res.status(401).json({error: 'You already challenged someone.'})
          }
          if(body.user?.name) {
              try {
                  const challenged = await User.findOne({name: body.user.name})
                  let cs = challengers.get(challenged._id)
                  if(!cs) {
                    cs = []
                  }
                  cs.push(challenger)
                  challenges.set(String(challenged._id), cs)
                  challengers.set(String(challenger._id), challenged)
              } catch (error) {
                  return res.status(400).json({error: 'User not found'})
              }
          }       
        return res.json({challenged:true, name: body.user?.name})
      } else {
        console.log("no session found")
          res.status(401).json({challenged: false})
      }
  })

  router.patch('/', restrict, async function(req, res, next) {
    let body = req.body
    if (req.session.user){
      const acceptant = req.session.user
      if(!challenges.get(acceptant._id)) {
          return res.status(401).json({error: 'Nobody challenged you.'})
      }
      if(body.user?.name) {
          try {
              let challenger = await User.findOne({name: body.user.name})
              let cs = challenges.get(acceptant._id)
              let indexToBeRemoved = cs.findIndex(element => element._id == challenger._id)
              if(indexToBeRemoved || indexToBeRemoved === 0) {
                challengers.delete(challenger._id)
                cs.splice(indexToBeRemoved,1)
                try{
                  let room = new Room({
                    name:  uuid.v4(),
                    player1: await User.findById(challenger._id),
                    player2: await User.findById(acceptant._id), 
                  })
                  try {
                    const newRoom = await room.save()                    
                    acceptedChallenges.set(String(challenger._id), room.name)
                  } catch (error) {
                    console.log(error)
                    return res.status(504).json({error: error.message})
                  }
                  console.log(`room created: ${room.name}`)
                  res.json({url: `/room/${room.name}`})
                } catch (error) {console.error(error); res.status(500).json({error: error.message})}
              }
          } catch (error) {
            console.log(error)
              return res.status(400).json({error: 'User not found'})
          }
      }
    }
  }) 

 
  module.exports = router
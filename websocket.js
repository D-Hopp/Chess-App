var WebSocket = require("ws");
const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

const chatRouter = require('./websocket/chat')
const gameRouter = require('./websocket/game')
const Room = require('./models/room');
const Session = require("./models/session");

const map = new Map();
const sessions = []


wss.on('connection', async function (ws, req) {
    const userId = req.session.user._id
    const userName = req.session.user.name
    map.set(userId, ws)
    const roomName = req.url.slice(2)
    if(roomName) {
        try {
            const room = await Room.findOne({name: roomName})
            console.log("Sessionsearch: "+sessions[0]?.name+" "+ roomName)
            const session = sessions.find(element => element.name == roomName)
            if (session) {
                console.log(`player ${userId} wants to join ${session.name}`)
                // Session with Room exists => check if player => join session else spectator
                    if (userId == session.player1._id) {
                        session.player1_joined = true
                    } else {
                        if (userId == session.player2._id) {
                            session.player2_joined = true
                        } else {
                            session.spectators.push(userId)
                            }
                        }
                try{
                    ws.send(JSON.stringify({target: "game", gamestate: await session.room.gamestate, activePlayer: session.activePlayer, error: ''})) 
                } catch(error) {console.log("cant send gamestate")}
                    
            } else {
                if (room) {
                    console.log(`create Session for ${room.name} requested by ${userId}`)
                     // room is valid but no session exists => create session
                    let newSession = new Session({name: room.name, room: room, player1: room.player1, player2: room.player2})
                    if (userId == newSession.player1._id) {
                        newSession.player1_joined = true
                    } else {
                        if (userId == newSession.player2._id) {
                            newSession.player2_joined = true
                        } else {
                            newSession.spectators.push(userId)
                            }
                        }
                   sessions.push(newSession)
                   ws.send(JSON.stringify({target: "game", gamestate: newSession.room.gamestate, activePlayer: newSession.activePlayer, error: ''}))                    
                }
            }

        } catch (error) {console.log(error.message); ws.close("bad room id")}
    }
    
  
    ws.on('message', function (message) {
        try {
            message = JSON.parse(message)
            message.name = userName
            switch (message.target) {
                case "chat":
                    chatRouter(sessions, map, userId, roomName, message)
                    break
                case "ping":
                    ws.send(JSON.stringify({}))    
                    break
                case "game":
                    gameRouter(sessions, map, userId, roomName, message)
                    break
                default:
                    ws.send(JSON.stringify({badRequest: true}))
            }
        } catch (error) {console.log(error.message); ws.send(JSON.stringify({badRequest: true}))}
    });

  
    ws.on('close', async function () {
        //TODO add spectator delete
        let toDelete = []
        let index = 0
        sessions.forEach(element => {
            if(element.player1 == userId) {
                element.player1_joined = false
            }
            if(element.player2 == userId) {
                element.player2_joined = false
            }
            if(!element.player1_joined && !element.player2_joined) {
                toDelete.push(index)
            } index++
        })
        toDelete.reverse()
            for (const i of toDelete) {
                console.log(`kill session ${i} from ${sessions.length}`)
                try {
                    const deleteRoom = await Room.deleteOne({name: sessions[i].name})
                    console.log(deleteRoom)
                    sessions.splice(i,1)
                } catch (error) {console.log(error.message)}
            }
        
        map.delete(userId);
    });

});

  module.exports = wss
const Room = require('../models/room')
const User = require('../models/user')


function chatRouter (sessions, map, userId, roomName, message) {
    const session = sessions.find(element => element.name == roomName)
    if (session) {
        map.get(String(session.player1))?.send(JSON.stringify(message))
        map.get(String(session.player2))?.send(JSON.stringify(message))
        for(let spectator of session.spectators) {
            map.get(String(spectator))?.send(JSON.stringify(message))
        }
    }
}



module.exports = chatRouter
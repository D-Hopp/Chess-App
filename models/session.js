const mongooose = require('mongoose')

const sessionSchema = new mongooose.Schema({
    name: {
        type: String,
        required: true,
    },
    room: {
        type: mongooose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
    },
    player1: {
        type: mongooose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    player1_joined: {
        type: Boolean,
        required: true,
        default: false,
    },
    player2: {
        type: mongooose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    player2_joined: {
        type: Boolean,
        required: true,
        default: false,
    },
    activePlayer: {
        type: Number,
        required: true,
        default: 1,
    },
    spectators: {
        type: [mongooose.Schema.Types.ObjectId],
        ref: 'User',
        required: true,
        default: []
    }
})

module.exports = mongooose.model('Session', sessionSchema)
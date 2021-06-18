const mongooose = require('mongoose')

const userSchema = new mongooose.Schema({
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: false,
        default: '',
    },
    email: {
        type: String,
        required: false,
    },
    games_played: {
        type: Number,
        required: true,
        default: 0,
    },
    games_won: {
        type: Number,
        required: true,
        default: 0,
    },
    last_login: {
        type: Date,
        required: true,
        default: Date.now,
    }
})

module.exports = mongooose.model('User', userSchema)
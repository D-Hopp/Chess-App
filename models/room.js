const mongooose = require('mongoose')

const roomSchema = new mongooose.Schema({
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: false,
    },
    player1: {
        type: mongooose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    player2: {
        type: mongooose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    gamestate: {
        type: [[String]],
        required: true, 
        default: 
        [   ['rook_w','pawn_w','','','','','pawn_b','rook_b'],
        ['knight_w','pawn_w','','','','','pawn_b','knight_b'],
        ['bishop_w','pawn_w','','','','','pawn_b','bishop_b'],
        ['queen_w','pawn_w','','','','','pawn_b','queen_b'],
        ['king_w','pawn_w','','','','','pawn_b','king_b'],
        ['bishop_w','pawn_w','','','','','pawn_b','bishop_b'],
        ['knight_w','pawn_w','','','','','pawn_b','knight_b'],
        ['rook_w','pawn_w','','','','','pawn_b','rook_b'],    ]
    },
    moves: {
        type: [ {
            piece: String,
            source: { x: Number, y: Number },
            target: { x: Number, y: Number},
        } ],
        required: true,
        default: [],
    },
    game_start: {
        type: Date,
        required: true,
        default: Date.now,
    },
    winner: {
        type: mongooose.Schema.Types.ObjectId,
        ref: 'User',
    }
})

module.exports = mongooose.model('Room', roomSchema)
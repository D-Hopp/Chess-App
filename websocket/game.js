const Room = require('../models/room')
const User = require('../models/user')
const Session = require('../models/session')


async function gameRouter (sessions, map, userId, roomName, message) {
    let responseMessage = 'Illegal Move.'
    let responseOnlySender = true
    let moved = false
    console.log(JSON.stringify(message))
    const session = sessions.find(element => element.name == roomName)
    let gamestate = session.room.gamestate
    let moves = session.room.moves
    let gameend = false
    if (session) {
        if (validateFormat(message.move)) {
            responseMessage = "It's not your turn yet!"
            let source = convertMessageToCoordinate(message.move).source
            let target = convertMessageToCoordinate(message.move).target
            if(validateActivePlayer(session, userId, source, target)) {     
                responseMessage = 'Illegal Move: Not a valid path.'           
                const piece = gamestate[source.x][source.y]
                if(validateMove(gamestate, session.activePlayer, source,  target, piece)) {
                    responseMessage = 'Illegal Move: Check!'
                    let newstate = JSON.parse(JSON.stringify(gamestate))
                    newstate[target.x][target.y] = piece
                    newstate[source.x][source.y] = ''
                    if(validateNoCheck(newstate, getKingLocation(newstate, session.activePlayer), session.activePlayer)) {
                        responseMessage = ''                   
                        responseOnlySender = false
                        //change activePlayer
                        gamestate = newstate
                        session.activePlayer = session.activePlayer==1 ? 2 : 1
                        let move = {piece: piece, source: source, target: target}
                        session.room.moves.push(move)
                        session.room.gamestate = gamestate
                        try {

                            const save = await Room.findOne({name: roomName})
                            save.gamestate = gamestate
                            save.moves.push(move)
                            const k = save.save()
                            moved = true

                        } catch (error) {console.log(error)}
                    }
                    
                }
                if(validateCastling(moves, gamestate, session.activePlayer, source,  target, piece)) {
                    let newstate = JSON.parse(JSON.stringify(gamestate))
                    if(source.y == 0 && target.x == 0) {
                        newstate[0][0] = ''
                        newstate[4][0] = ''
                        newstate[2][0] = 'king_w'
                        newstate[3][0] = 'rook_w'
                    }
                    if(source.y == 0 && target.x == 7) {
                        newstate[7][0] = ''
                        newstate[4][0] = ''
                        newstate[6][0] = 'king_w'
                        newstate[5][0] = 'rook_w'
                    }

                    if(source.y == 7 && target.x == 0) {
                        newstate[0][7] = ''
                        newstate[4][7] = ''
                        newstate[2][7] = 'king_b'
                        newstate[3][7] = 'rook_b'
                    }
                    if(source.y == 7 && target.x == 7) {
                        newstate[7][7] = ''
                        newstate[4][7] = ''
                        newstate[6][7] = 'king_b'
                        newstate[5][7] = 'rook_b'
                    }
                    if(validateNoCheck(newstate, getKingLocation(newstate, session.activePlayer), session.activePlayer)) {
                        //change activePlayer
                        gamestate = newstate
                        session.activePlayer = session.activePlayer==1 ? 2 : 1
                        let move = {piece: piece, source: source, target: target}
                        session.room.moves.push(move)
                        session.room.gamestate = gamestate
                        try {

                            const save = await Room.findOne({name: roomName})
                            save.gamestate = gamestate
                            save.moves.push(move)
                            const k = save.save()
                            moved = true
                        } catch (error) {console.log(error)}
                    }
                }
                if(validateEnPassant(moves, gamestate, session.activePlayer, source, target, piece)) {
                    let newstate = JSON.parse(JSON.stringify(gamestate))
                    newstate[target.x][target.y] = newstate[source.x][source.y]
                    newstate[target.x][source.y] = ''
                    newstate[source.x][source.y] = ''
                    if(validateNoCheck(newstate, getKingLocation(newstate, session.activePlayer), session.activePlayer)) {
                        //change activePlayer
                        gamestate = newstate
                        session.activePlayer = session.activePlayer==1 ? 2 : 1
                        let move = {piece: piece, source: source, target: target}
                        session.room.moves.push(move)
                        session.room.gamestate = gamestate
                        try {

                            const save = await Room.findOne({name: roomName})
                            save.gamestate = gamestate
                            save.moves.push(move)
                            const k = save.save()
                            moved = true
                        } catch (error) {console.log(error)}
                    }
                }
            }
        }
        if(moved) {
            responseMessage = ''
            responseOnlySender = false
            if( ! validateNoCheck(gamestate, getKingLocation(gamestate, session.activePlayer), session.activePlayer)) {
                responseMessage = 'Check!'
                const checkmate = await checkMate(moves, gamestate, session.activePlayer)
                if(checkmate) {
                    session.room.winner = session.activePlayer == 1 ? session.player2 : session.player1
                    responseMessage = '!Checkmate!'
                    session.activePlayer = 0
                    gameend = true
                }
            }
        }
        if(message.move == 'surrender') {
            if(session.activePlayer != 0) {
                session.room.winner = String(session.player1) == String(userId) ? String(session.player2) : session.room.winner
                session.room.winner = String(session.player2) == String(userId) ? String(session.player1) : session.room.winner
                if(session.room.winner){
                    responseOnlySender = false
                    session.activePlayer = 0
                    responseMessage = `${message.name} surrendered.`
                    gameend = true
                }
            }
        }
        if(gameend) {
            console.log("save game")
            try {

                const savewin = await Room.findOne({name: roomName})
                savewin.winner = session.room.winner
                savewin.save()
                const savep1 = await User.findById(String(session.player1))
                const savep2 = await User.findById(String(session.player2))
                savep1.games_played += 1
                savep2.games_played += 1
                if (session.room.winner == String(session.player1)) {
                    savep1.games_won += 1
                } else {
                    savep2.games_won += 1
                }
                savep1.save()
                savep2.save()
            } catch (error) {
                console.log(error)
            }
        }
        let response = {target: "game", gamestate: session.room.gamestate, activePlayer: session.activePlayer, error: responseMessage, move: message.move}
        if(responseOnlySender) {
            map.get(String(userId))?.send(JSON.stringify(response))
        } else {
            map.get(String(session.player1))?.send(JSON.stringify(response))
            map.get(String(session.player2))?.send(JSON.stringify(response))
            for(let spectator of session.spectators) {
                map.get(String(spectator))?.send(JSON.stringify(message))
            }
        }
        
        
    }
}

async function checkMate(moves, gamestate, activePlayer) {
    let pieces = []
    for(let x = 0; x < 8; x++) {
        for(let y = 0; y < 8; y++) {
            let piece = gamestate[x][y]
            if(piece != '') {
                let pieceColor = piece.split('_')[1] == 'w' ? 1 : 2
                if(pieceColor == activePlayer) {
                    pieces.push({piece: piece, position: {x: x, y: y}})                    
                }
            }
        }
    }

    for await(let piece of pieces) {
        let isPawn = piece.piece.split('_')[0] == 'pawn' ? true : false
        for(let x = 0; x < 8; x++) {
            for(let y = 0; y < 8; y++) {
                if(validateMove(gamestate, activePlayer, piece.position, {x:x, y:y}, piece.piece)) {
                    let newstate = JSON.parse(JSON.stringify(gamestate))
                    newstate[x][y] = piece.piece
                    newstate[piece.position.x][piece.position.y] = ''
                    if(validateNoCheck(newstate, getKingLocation(newstate, activePlayer), activePlayer)) {
                        return false
                    }
                    continue
                }
                if(isPawn) {
                    if(validateEnPassant(moves, gamestate, activePlayer, piece.position, {x:x, y:y}, piece.piece)) {
                        let newstate = JSON.parse(JSON.stringify(gamestate))
                        newstate[x][y] = newstate[piece.position.x][piece.position.y]
                        newstate[x][piece.position.y] = ''
                        newstate[piece.position.x][piece.position.y] = ''
                        if(validateNoCheck(newstate, getKingLocation(newstate, activePlayer), activePlayer)) {
                            return false
                        }
                    }
                }

            }
        }
    }
    return true
}

function validateEnPassant(moves, gamestate, activePlayer, source, target, piece) {
    if (piece == '') {
        return false
    }
    const color = piece.split('_')[1]
    const targetColor = gamestate[target.x][target.y] != '' ? gamestate[target.x][target.y].split('_')[1] : ''
    //Corrupted gamestate
    if (color.length != 1) {
        return false
    }
    if (activePlayer == 1 && color=='b') {
        return false
    }
    if (activePlayer == 2 && color=='w') {
        return false
    }
    if(targetColor != '') {
        return false
    }
    if(moves.length < 2 ) {
        return false
    }
    if (piece == 'pawn_w' && source.y == 4 && target.y == 5) {
        let lastmove = moves[moves.length-1]
        if (lastmove.piece == 'pawn_b' && lastmove.source.x == target.x && lastmove.source.y == 6 && lastmove.target.y == 4) {
            if(target.x-source.x == 1 || target.x-source.x == -1) {
                return true
            }
        }
    }    
    if (piece == 'pawn_b' && source.y == 3 && target.y == 2) {
        let lastmove = moves[moves.length-1]
        if (lastmove.piece == 'pawn_w' && lastmove.source.x == target.x && lastmove.source.y == 1 && lastmove.target.y == 3) {
            if(target.x-source.x == 1 || target.x-source.x == -1) {
                return true
            }
        }
    }
    return false
}

function getKingLocation (gamestate, activePlayer) {
    let king = activePlayer == 1 ? 'king_w' : 'king_b'
    for(let x = 0; x < 8; x++) {
        for(let y = 0; y < 8; y++) {
            if(gamestate[x][y] == king) {
                return {x:x, y:y}
            }
        }
    }
    return null
}

function validateNotMoved(moves, source) {
    
    for (let move of moves) {
        if (move.source.x == source.x && move.source.y == source.y) {
            return false
        }
    }
    return true
}


function convertMessageToCoordinate(move) {
    let source = {}
    source.x = convertCharCodeToCoordinate(move.charCodeAt(0))
    source.y = convertCharCodeToCoordinate(move.charCodeAt(1))
    let target = {}
    target.x = convertCharCodeToCoordinate(move.charCodeAt(2))
    target.y = convertCharCodeToCoordinate(move.charCodeAt(3))
    return {source: source, target: target}
}

//Might break with pawn in second to last row
function validateCastling (moves, gamestate, activePlayer, source, target, piece) {
    if (piece == '') {
        return false
    }
    const color = piece.split('_')[1]
    const targetColor = gamestate[target.x][target.y] != '' ? gamestate[target.x][target.y].split('_')[1] : ''
    //Corrupted gamestate
    if (color.length != 1) {
        return false
    }
    if (activePlayer == 1 && color=='b') {
        return false
    }
    if (activePlayer == 2 && color=='w') {
        return false
    }
    if(piece == "king_w") {
        if(gamestate[target.x][target.y] == 'rook_w') {
            if(validateNotMoved(moves, {x:4, y:0})) {
                if(validateNotMoved(moves, {x:0, y:0})) {
                    let path = []
                    if(target.x == 0 && target.y == 0) {
                        path = [{x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y:0}]
                        if(validateFreePath(path, gamestate)){
                            path[0].x = 4
                            for(let field of path) {
                                if(!validateNoCheck(gamestate, field, 1)) {
                                    return false
                                }
                            }
                            return true
                        }
                    }
                }
                if(validateNotMoved(moves, {x:0, y:0})) {
                    let path = []
                    if(target.x == 7 && target.y == 0) {
                        path = [{x: 6, y: 0}, {x: 5, y: 0}]
                        if(validateFreePath(path, gamestate)){
                            path[0].x = 4
                            for(let field of path) {
                                if(!validateNoCheck(gamestate, field, 1)) {
                                    return false
                                }
                            }
                            return true
                        }
                    }
                }
            }
        }
    }
    if(piece == "king_b") {
        if(gamestate[target.x][target.y] == 'rook_b') {
            if(validateNotMoved(moves, {x:4, y:7})) {
                if(validateNotMoved(moves, {x:0, y:7})) {
                    let path = []
                    if(target.x == 0 && target.y == 7) {
                        path = [{x: 1, y: 7}, {x: 2, y: 7}, {x: 3, y:7}]
                        if(validateFreePath(path, gamestate)){
                            path[0].x = 4
                            for(let field of path) {
                                if(!validateNoCheck(gamestate, field, 2)) {
                                    return false
                                }
                            }
                            return true
                        }
                    }
                }
                if(validateNotMoved(moves, {x:7, y:7})) {
                    let path = []
                    if(target.x == 7 && target.y == 7) {
                        path = [{x: 6, y: 7}, {x: 5, y: 7}]
                        if(validateFreePath(path, gamestate)){
                            path[0].x = 4                            
                            for(let field of path) {
                                if(!validateNoCheck(gamestate, field, 2)) {
                                    return false
                                }
                            }
                            return true
                        }
                    }
                }
            }
        }
    }
    return false
}

function validateNoCheck(gamestate, kinglocation, activePlayer) {
    const enemyPlayer = activePlayer == 1 ? 2 : 1
    for(let x = 0; x < 8; x++) {
        for(let y = 0; y < 8; y++) {
            let piece = gamestate[x][y]
            if(validateMove(gamestate, enemyPlayer, {x:x, y:y},  kinglocation, piece)) {
                return false
            }
        }
    }
    return true
}

function validateMove (gamestate, activePlayer, source, target, piece) {
    if (piece == '') {
        return false
    }
    const color = piece.split('_')[1]
    const targetColor = gamestate[target.x][target.y] != '' ? gamestate[target.x][target.y].split('_')[1] : ''
    //Corrupted gamestate
    if (color.length != 1) {
        return false
    }
    if (activePlayer == 1 && color=='b') {
        return false
    }
    if (activePlayer == 2 && color=='w') {
        return false
    }
    switch (piece) {
        case "rook_w":
            if(color==targetColor) {
                return false
            }
            return rook("w", source, target, gamestate)
            break
        case "rook_b":
            if(color==targetColor) {
                return false
            }
            return rook("b", source, target, gamestate)
            break
        case "knight_w":
            if(color==targetColor) {
                return false
            }
            return knight('w', source, target, gamestate)
            break
        case "knight_b":
            if(color==targetColor) {
                return false
            }
            return knight('b', source, target, gamestate)
            break
        case "bishop_w":
            if(color==targetColor) {
                return false
            }
            return bishop('w', source, target, gamestate)
            break
        case "bishop_b":
            if(color==targetColor) {
                return false
            }
            return bishop('b', source, target, gamestate)
            break
        case "queen_w":
            if(color==targetColor) {
                return false
            }
            return queen('w', source, target, gamestate)
            break
        case "queen_b":
            if(color==targetColor) {
                return false
            }
            return queen('b', source, target, gamestate)
            break
        case "king_w":
            return king('w', source, target, gamestate)
            break
        case "king_b":
            return king('b', source, target, gamestate)
            break
        case "pawn_w":
            return pawn('w', source, target, gamestate)
            break
        case "pawn_b":
            return pawn('b', source, target, gamestate)
            break
        default:
            return false
    }

    return true
}

function validateFreePath(fields, gamestate) {   
    for (let field of fields) {
        if (gamestate[field.x][field.y] != '') {
            return false
        } 
    }
    return true
}

function rook(color, source, target, gamestate) {
    if (source.x != target.x && source.y != target.y) {
        return false
    }
    let path = []
    //Go right
    for (let x = source.x+1; x < target.x; x++) {
        path.push({x: x, y: source.y})
    }
    //Go left
    for (let x = source.x-1; x > target.x; x--) {
        path.push({x: x, y: source.y})
    }
    //Go up
    for (let y = source.y+1; y < target.y; y++) {
        path.push({x: source.x, y: y})
    }
    //Go down
    for (let y = source.y-1; y > target.y; y--) {
        path.push({x: source.x, y: y})
    }
    if(validateFreePath(path, gamestate)) {
        return true
    }
    return false
}

function knight(color, source, target, gamestate) {
    if(source.x-target.x == 1 || source.x-target.x == -1) {
        if(source.y-target.y == 2 || source.y-target.y == -2) {
            return true
        }
    }
    if(source.x-target.x == 2 || source.x-target.x == -2) {
        if(source.y-target.y == 1 || source.y-target.y == -1) {
            return true
        }
    }
    return false
}

function bishop(color, source, target, gamestate) {
    if ((source.x-target.x != source.y-target.y) && (source.x-target.x + source.y-target.y) != 0) {
        return false
    }
    let path = []
    //Go right
    //[ { x: 4, y: 1 }, { x: 3, y: 1 }, { x: 4, y: -1 }, { x: 3, y: -1 } ]
    let y = source.y+1 
    for (let x = source.x+1; x < target.x; x++) {
        if(y < target.y) {
            path.push({x: x, y: y}) //Up right
            y++
        }
    }
    y = source.y-1 
    for (let x = source.x+1; x < target.x; x++) {
        if(y > target.y) {
            path.push({x: x, y: y})  //Down right
            y--
        }
    }
    //Go left
    y = source.y+1 
    for (let x = source.x-1; x > target.x; x--) {
        if(y < target.y) {
            path.push({x: x, y: y}) //Up right
            y++
        }
    }
    y = source.y-1 
    for (let x = source.x-1; x > target.x; x--) {
        if(y > target.y) {
            path.push({x: x, y: y})  //Down right
            y--
        }
    }

    if(validateFreePath(path, gamestate)) {
        return true
    }
    return false
}

function queen(color, source, target, gamestate) {
    if (bishop(color, source, target, gamestate) || rook(color, source, target, gamestate)) {
        return true
    }
    return false
}

function king(color, source, target, gamestate) {
    const targetColor = gamestate[target.x][target.y] != '' ? gamestate[target.x][target.y].split('_')[1] : ''
    if(color!=targetColor) {
        //Diagonal
        if(source.x-target.x == 1 || source.x-target.x == -1) {
            if(source.y-target.y == 1 || source.y-target.y == -1) {
                return true
            }
        }
        //Horizental
        if(source.x-target.x == 1 || source.x-target.x == -1) {
            if(source.y == target.y) {
                return true
            }
        }
        //vertical
        if(source.y-target.y == 1 || source.y-target.y == -1) {
            if(source.x == target.x) {
                return true
            }        
        }
    }

    return false
}

function pawn(color, source, target, gamestate) {
    const targetColor = gamestate[target.x][target.y] != '' ? gamestate[target.x][target.y].split('_')[1] : ''
    //Double move white
    if(color == 'w' && source.y == 1) {
        if (source.x == target.x && target.y == 3) {
            let path = [{x: source.x, y: source.y+1}, {x: target.x, y: target.y}]
            if(validateFreePath(path, gamestate)) {
                return true
            }
        }
    }
    //Double move black
    if(color == 'b' && source.y == 6) {
        if (source.x == target.x && target.y == 4) {
            let path = [{x: source.x, y: source.y-1}, {x: target.x, y: target.y}]
            if(validateFreePath(path, gamestate)) {
                return true
            }
        }
    }
    //Single move white
    if(color == 'w') {
        //move
        if(source.x == target.x && target.y - source.y == 1) {
            if(validateFreePath([{x: target.x, y: target.y}], gamestate)) {
                return true
            }
        }
        //capture
        if((target.x - source.x == 1 || target.x - source.x == -1) && target.y - source.y == 1) {
            if(targetColor=='b') {
                return true
            }
        }
    }
    //Single move black
    if(color == 'b') {
        if(source.x == target.x && target.y - source.y == -1) {
            if(validateFreePath([{x: target.x, y: target.y}], gamestate)) {
                return true
            }
        }
        if((target.x - source.x == 1 || target.x - source.x == -1) && target.y - source.y == -1) {
            if(targetColor=='w') {
                return true
            }
        }
    }
    return false
}


//Does not validate Number, shifts index form 1 to 0
function convertCharCodeToCoordinate (charCode) {
    return charCode-49
}

function validateActivePlayer (session, userId) {
    if (session.activePlayer == 1) {
        if(String(session.player1._id) == userId) {

            return true
        }
    } 
    if (session.activePlayer == 2) {
        if(String(session.player2._id) == userId) {
            return true
        }
    }
    return false
}

//Expected Form String: {"abcd"| a,b,c,d element of {1 .. 8}}
function validateFormat (input) {
    try {
        if (input.length != 4) return false
        for (let i = 0; i < 4; i++) {
            if (input.charCodeAt(i) < 49 || input.charCodeAt(i) > 56) return false
        }
        return true
    } catch (error) {console.log(error); return false;}
}



module.exports = gameRouter
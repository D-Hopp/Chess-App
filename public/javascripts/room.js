

//Utility to create n-dimensional Array
function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}

//Create Chessboard
var chessboard = document.getElementById("chessboard")
var chessrows = createArray(10)
var chessfields = createArray(10,10)

try{
//Create Headrow    
let newRatio1 = document.createElement("div")
newRatio1.className = "ratio"
newRatio1.style = "--bs-aspect-ratio: 10%;"
chessrows[0] = document.createElement("div")
chessrows[0].setAttribute("class", "row")
newRatio1.appendChild(chessrows[0])
chessboard.appendChild(newRatio1)
for (let x = 0; x < 10; x++) {    
    let char = (x!==0 && x!==9) ? String.fromCharCode(64+x) : ""
    let newDiv = document.createElement("div")
    newDiv.setAttribute("class", "col text-center ")
    let innerDiv = document.createElement("div")
    newDiv.className += 'center-text-outer'
    innerDiv.className += 'center-text-inner'
    innerDiv.innerText = char
    newDiv.appendChild(innerDiv)
    chessfields[x][0] = newDiv
    chessrows[0].appendChild(chessfields[x][0])
}
//Create Field
for(let y = 1; y < 9; y++) {
    let newRatio = document.createElement("div")
    newRatio.className = "ratio"
    newRatio.style = "--bs-aspect-ratio: 10%;"
    chessrows[y] = document.createElement("div")
    chessrows[y].setAttribute("class", "row")
    newRatio.appendChild(chessrows[y])
    chessboard.appendChild(newRatio)
    for (let x = 0; x < 10; x++) {    
        let char = (x==0 || x==9) ? y : ""
        let newDiv = document.createElement("div")
        
        newDiv.className += `col text-center ${decideFieldColor(x,y)}`
        if(char) {
            let innerDiv = document.createElement("div")
            newDiv.className += 'center-text-outer'
            innerDiv.className += 'center-text-inner'
            innerDiv.innerText = char
            newDiv.appendChild(innerDiv)
        }
        chessfields[x][y] = newDiv
           
        chessrows[y].appendChild(chessfields[x][y])
    }
}
function decideFieldColor(x,y) {
    if(x == 0) {
        return ""
    }
    if(x == 9) {
        return ""
    }
    if(x % 2 == 0 && y % 2 == 1) {
        return "bg-light outline"
    }
    if(x % 2 == 1 && y % 2 == 0) {
        return "bg-light outline"
    }
    return "bg-light-gray outline"
}

//Create Footrow
let newRatio2 = document.createElement("div")
newRatio2.className = "ratio"
newRatio2.style = "--bs-aspect-ratio: 10%;"
chessrows[9] = document.createElement("div")
chessrows[9].setAttribute("class", "row")
newRatio2.appendChild(chessrows[9])
chessboard.appendChild(newRatio2)
for (let x = 0; x < 10; x++) {    
    let char = (x!==0 && x!==9) ? String.fromCharCode(64+x) : ""
    let newDiv = document.createElement("div")
    newDiv.setAttribute("class", "col text-center ")
    let innerDiv = document.createElement("div")
    newDiv.className += 'center-text-outer'
    innerDiv.className += 'center-text-inner'
    innerDiv.innerText = char
    newDiv.appendChild(innerDiv)
    chessfields[x][9] = newDiv
    chessrows[9].appendChild(chessfields[x][9])
}

} catch(error) {console.log(error)}

var gamestate
function updateGamestate (data) {
    let player1 = document.getElementById("player1")
    let player2 = document.getElementById("player2")

    if(data.activePlayer == 1) {
        player1.style.setProperty('--color', 'rgba(255,0,0,1)')
        player2.style.setProperty('--color', 'rgba(255,0,0,0)')
    }
    if(data.activePlayer == 2) {
        player2.style.setProperty('--color', 'rgba(255,0,0,1)')
        player1.style.setProperty('--color', 'rgba(255,0,0,0)')
    }
    gamestate = data.gamestate
    for(let x = 1; x < 9; x++) {
        for(let y = 1; y < 9; y++) {
            if(data.gamestate[x-1][y-1]!="") {
                chessfields[x][y].style.backgroundImage = `url(/${data.gamestate[x-1][y-1]}.png)`
            } else {
                chessfields[x][y].style.backgroundImage = ''
            }                
            chessfields[x][y].data = data.gamestate[x-1][y-1]
            chessfields[x][y].style.backgroundSize = 'cover'
            chessfields[x][y].id = `${x}${y}`
            chessfields[x][y].addEventListener("click", chessListener)
        }
    }
}

var toggled = ''
function settoggled(source) {
    if(!toggled) {
        toggled= source
    } else {
        toggled = ''
        for(let x = 1; x < 9; x++) {
            for(let y = 1; y < 9; y++) {
                chessfields[x][y].style.setProperty('--color', 'black')
            }
        }
    }
}


async function chessListener (event) {
    const source = event.target.id
    if(toggled==source) {
        settoggled()
        return
    }
    if(!toggled) {
        settoggled(source)

        event.target.style.setProperty('--color', 'red')
        await suggestMove(source)
        return
    }
    document.getElementById(toggled).style.setProperty('--color', 'black')
    websocket.send(JSON.stringify({target: "game", move: toggled+source}))
    settoggled()
}


//---------------Suggest Move------------------------


async function suggestMove(sourceString) {
    let source = {}
    source.x = convertCharCodeToCoordinate(sourceString.charCodeAt(0))
    source.y = convertCharCodeToCoordinate(sourceString.charCodeAt(1))
    let validFields = []
    let numbers = []
    for(let i = 0; i < 8; i++) {
        numbers.push(i)
    }
    for await(let x of numbers) {
        for await(let y of numbers) {
            if(validateMove(gamestate, source, {x:x, y:y}, gamestate[source.x][source.y])) {
                let newstate = JSON.parse(JSON.stringify(gamestate))                
                newstate[x][y] = newstate[source.x][source.y]
                newstate[source.x][source.y] = ''
                if(await validateNoCheck(newstate, getKingLocation(newstate, newstate[x][y].split('_')[1]))) {
                    validFields.push({x:x, y:y})
                }
            }
        }
    }
    for(let field of validFields) {
        chessfields[field.x+1][field.y+1].style.setProperty('--color', 'rgba(255,0,0,1)')
    }
}

function getKingLocation (gamestate, color) {
    let king = `king_${color}`
    for(let x = 0; x < 8; x++) {
        for(let y = 0; y < 8; y++) {
            if(gamestate[x][y] == king) {
                return {x:x, y:y}
            }
        }
    }
    return null
}

async function validateNoCheck(gamestate, kinglocation) {
    let numbers = []
    for(let i = 0; i < 8; i++) {
        numbers.push(i)
    }
    for await(let x of numbers) {
        for await(let y of numbers) {
            let piece = gamestate[x][y]
            if(validateMove(gamestate, {x:x, y:y},  kinglocation, piece)) {
                return false
            }
        }
    }
    return true
}

function validateMove (gamestate, source, target, piece) {
    if (piece == '') {
        return false
    }
    const color = piece.split('_')[1]
    const targetColor = gamestate[target.x][target.y] != '' ? gamestate[target.x][target.y].split('_')[1] : ''
    //Corrupted gamestate
    if (color.length != 1) {
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



function convertMessageToCoordinate(move) {
    let source = {}
    source.x = convertCharCodeToCoordinate(move.charCodeAt(0))
    source.y = convertCharCodeToCoordinate(move.charCodeAt(1))
    let target = {}
    target.x = convertCharCodeToCoordinate(move.charCodeAt(2))
    target.y = convertCharCodeToCoordinate(move.charCodeAt(3))
    return {source: source, target: target}
}
function convertCharCodeToCoordinate (charCode) {
    return charCode-49
}

//-------------Chat Listener------------------------------

function chatListener (event) {
    if(websocket.readyState == websocket.OPEN) {
        let text = document.getElementById('chatinput').elements[0].value
        if(text) {
            websocket.send(JSON.stringify({target: "chat", text: text}))
            document.getElementById('chatinput').elements[0].value = ""
        }
    }    
    event.preventDefault()
}

//--------------Surrender Button----------------------

function surrender(event) {
    if(websocket.readyState == websocket.OPEN) {
        websocket.send(JSON.stringify({target: "game", move: 'surrender'}))
    }
}

//---------------Websocket----------------------------
var websocket
window.onload = function () {
    websocket = new WebSocket(`wss://hoppius.work/ws/${window.location.pathname.slice(6)}`)

    //Handler functions to keep the socket open
    var timerId = 0; 
    function keepAlive() { 
        var timeout = 20000;  
        if (websocket.readyState == websocket.OPEN) {  
            websocket.send(JSON.stringify({target: "ping", text:"ping"}));  
        }  
        timerId = setTimeout(keepAlive, timeout);  
    }  
    function cancelKeepAlive() {  
        if (timerId) {  
            clearTimeout(timerId);  
        }  
    }

    //On Socket Open
    websocket.onopen = function (event) {
        console.log(event)
        websocket.send(JSON.stringify({target: "chat", text:"joined the room."}))
        //Pinging to keep connection open
        keepAlive()
    }
    websocket.onmessage = function (event) {
        try{
            const data = JSON.parse(event.data)
            console.log(data)
            //Chatmessage
            if(data.target=="chat") {
                const date = new Date()
                let chat = document.getElementById("chat")
                chat.innerText +=`\n${date.toLocaleTimeString()}  ${data.name}: ${data.text}`
                chat.scrollTop = chat.scrollHeight
            }
            //Gamestate update
            if(data.target=="game") {
                if(data.error) {

                    if(data.error == "Illegal Move" || data.error == "It's not your turn yet!" || data.error == "Illegal Move: Check") {
                        data.move = null
                    }
                }
                if(data.move) {
                    if(data.move != 'surrender'){   
                        let source = convertMessageToCoordinate(data.move).source
                        let target = convertMessageToCoordinate(data.move).target
                        let piece = chessfields[source.x+1][source.y+1].data.split('_')[0]
                        let moves = document.getElementById("moves")
                        moves.innerText += `\n${piece} from ${String.fromCharCode(64+source.x+1)}${source.y+1} to ${String.fromCharCode(64+target.x+1)}${target.y+1}`
                        moves.scrollTop = chat.scrollHeight
                    }
                }
                if(data.error) {
                    if(data.error != '') {
                    let moves = document.getElementById("moves")
                    moves.innerText += `\n ${data.error}`
                    moves.scrollTop = chat.scrollHeight
                    }
                }
                updateGamestate(data)
                if(data.error) {
                    if(data.error == '!Checkmate!') {
                        let player1 = document.getElementById("player1")
                        let player2 = document.getElementById("player2")
                        if(player1.style.getPropertyValue('--color') == 'rgba(255,0,0,1)') {
                            player1.style.setProperty('--color', 'rgba(0,255,0,1)')
                        }
                        if(player2.style.getPropertyValue('--color') == 'rgba(255,0,0,1)') {
                            player2.style.setProperty('--color', 'rgba(0,255,0,1)')
                        }
                    }
                } 
                if(data.move) {
                    if(data.move == 'surrender') {
                        data.move = null
                        let player1 = document.getElementById("player1")
                        let player2 = document.getElementById("player2")
                        player1.style.setProperty('--color', 'rgba(255,0,0,0)')
                        player2.style.setProperty('--color', 'rgba(255,0,0,0)')
                        if(data.error.split(' ')[0] != player1.innerHTML) {
                            player1.style.setProperty('--color', 'rgba(0,255,0,1)')
                        }
                        if(data.error.split(' ')[0] != player2.innerHTML) {
                            player2.style.setProperty('--color', 'rgba(0,255,0,1)')
                        }
                    }
                }
            }
        } catch (error) {console.log("JSON parse error"+error)}
    }
    websocket.onclose = function (event) {
        cancelKeepAlive()
        document.getElementById("chat").innerText +=`\nYou got disconnected!`
    }
    document.getElementById("chatinput").addEventListener("submit", chatListener)
    document.getElementById("surrender").addEventListener("click", surrender)

}
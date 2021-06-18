
function challengeSubmit(event) {
    fetch('/challenge', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user: {
                name: document.getElementById('challengename').value
            }
        })
    }).then(res => res.json())
    .then(data => {
        console.log("res")
        console.log(data)
        if(data?.challenged) {
            if(data.name) {
                let activeChallengeButton = document.createElement('button') 
                activeChallengeButton.innerHTML = `${data.name}`
                document.getElementById("challengeDisplay").appendChild(activeChallengeButton)
            }
        }
    })
}

function updateChallenges() {
    fetch('/challenge', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(res => res.json())
    .then(data => {
        let display = document.getElementById("challengeDisplay")
        while(display.firstChild) {
            display.removeChild(display.firstChild)
        }
        console.log(data)
        if(data?.url) {
            window.location.href = `https://hoppius.work${data.url}`
        }
        if(data?.data) {
            if(data.data.challenges) {
                let currentChallengeButton = document.createElement('button')
                currentChallengeButton.innerHTML = `${data.data.challenges}`
                document.getElementById("challengeDisplay").appendChild(currentChallengeButton)
            }
            if(data.data.names) {
                for(challengername of data.data.names) {
                    let activeChallengeButton = document.createElement('button') 
                    activeChallengeButton.innerHTML = `${challengername}`
                    activeChallengeButton.addEventListener("click", acceptChallenge)
                    document.getElementById("challengeDisplay").appendChild(activeChallengeButton)
                }
            }            
        }
    })
}

function acceptChallenge(event) {
    console.log(event.target.innerHTML)
    fetch('/challenge', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user: {
                name: event.target.innerHTML
            }
        })
    }).then(res => res.json())
    .then(data => {
        console.log(data)
        if(data?.url) {
            window.location.href = `https://hoppius.work${data.url}`
        }
        if(data?.error) {
            console.log(data.error)
        }
    })
}

function attachFormSubmitEvent(formId){
    document.getElementById(formId).addEventListener("submit", challengeSubmit);
}

attachFormSubmitEvent("challengeForm")
setInterval(updateChallenges, 2000)
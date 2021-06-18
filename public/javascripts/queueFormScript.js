function queue() {
    fetch('/queue', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },        
    }).then(res => {
        return res.json()
    }).then(response => {
        if(response.queued){

            document.getElementById("queuebutton").innerText="Queued"
            setInterval(checkQueuePop,2000)
        }
        if(response.url){
            window.location.href = response.url
        }
    })
}
var i=0

function checkQueuePop () {
   console.log(i++)
    console.log
    fetch('/queue', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },        
    }).then(res => {
        return res.json()
    }).then(response => {
        if(response.queued){
            document.getElementById("queuebutton").innerText="Still Queued"
        }
        if(response.url){
            window.location.href = response.url
        }
    })
}
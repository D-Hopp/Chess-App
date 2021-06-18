function loginFormSubmit(event) {
    fetch('/auth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user: {
                name: document.getElementById('username').value,
                password: document.getElementById('password').value
            }
        })
    }).then(res => res.json())
    .then(data => {
        console.log("res")
        console.log(data)
        if(data.username) {
            document.getElementById("navbarLoginDisplay").innerHTML = data.username
            document.getElementById("navbarRegister").hidden = true
        }
        if(index) {
            window.location.href = `https://hoppius.work/users/${data.username}`
        }
    })
}

function registerFormSubmit(event) {
    fetch('/auth', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user: {
                name: document.getElementById('username-register').value,
                password: document.getElementById('password-register').value
            },
            redirect: index
        })
    }).then(res => res.json())
    .then(data => {
        console.log("res")
        console.log(data)
        if(data.username) {
            document.getElementById("navbarLoginDisplay").innerHTML = data.username
            document.getElementById("navbarRegister").hidden = true
        }
        if(index) {
            window.location.href = `https://hoppius.work/users/${data.username}`
        }
    })
}

function attachFormSubmitEvent(formId, formSubmit){
    document.getElementById(formId).addEventListener("submit", formSubmit);
}

attachFormSubmitEvent("loginForm", loginFormSubmit)
attachFormSubmitEvent("registerForm", registerFormSubmit)

if(document.getElementById("loginName")?.innerHTML) {
    document.getElementById("navbarLoginDisplay").innerHTML = document.getElementById("loginName").innerHTML
    document.getElementById("navbarRegister").hidden = true
}

/*
function formSubmit(event) {
    let url = authServer.AuthorizationServer
    let request = new XMLHttpRequest()
    request.open('POST', url, true)
    request.onload = function() { // request successful
    // we can use server response to our request now
      console.log(request.responseText)
    }
  
    request.onerror = function() {
      // request failed
    }
  
    console.log(event.target)

    var clientId = document.getElementById("username").value;
    var clientPassword = document.getElementById("password").value;
    let authorizationBasic = window.btoa(clientId+":"+clientPassword)
    
    request.overrideMimeType("text/html")
    request.setRequestHeader('Content-Type', 'raw; charset=UTF-8')
    request.setRequestHeader('Authorization', 'Basic ' + authorizationBasic)
    request.setRequestHeader('Accept', 'application/json')
    request.send({username: clientId, password: clientPassword}) // create FormData from form that triggered event

    request.onreadystatechange = function () {
        if (request.readyState === 4) {
        alert(request.responseText);
        }
    }; 
    event.preventDefault()
}
  
function attachFormSubmitEvent(formId){
    document.getElementById(formId).addEventListener("submit", formSubmit);
}

attachFormSubmitEvent("loginForm") */

/*
document.getElementById("login").onclick = ()=>{

    var clientId = document.getElementById("username").value;
    var clientPassword = document.getElementById("password").value;

    console.log("click")

    // var authorizationBasic = $.base64.btoa(clientId + ':' + clientSecret);
    let authorizationBasic = window.btoa(clientId + ':' + clientPassword);

    let request = new XMLHttpRequest();
    request.open('POST', authServer.AuthorizationServer, true);
    request.setRequestHeader('Content-Type', 'raw; charset=UTF-8');
    request.setRequestHeader('Authorization', 'Basic ' + authorizationBasic);
    request.setRequestHeader('Accept', 'application/json');
    request.send(); //`username=${clientId}&password=${clientPassword}&grant_type=password`

    request.onreadystatechange = function () {
        if (request.readyState === 4) {
        alert(request.responseText);
        }
    }; 
}*/
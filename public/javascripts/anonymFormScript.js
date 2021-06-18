
function formSubmit(event) {
    window.open(`https://hoppius.work/users/${document.getElementById('choosenname').value}`, "_self")
}

function attachFormSubmitEvent(formId){
    document.getElementById(formId).addEventListener("submit", formSubmit);
}

attachFormSubmitEvent("anonymForm")
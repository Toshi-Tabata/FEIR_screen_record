const modal = document.getElementById("sSModalMenu");
const btn = document.getElementById("sSModal");
const span = document.getElementsByClassName("close");

// When the user clicks on the button, open the modal
btn.onclick = function(){
    modal.style.display = "block";
};

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
};
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event){
    if (event.target === modal){
        modal.style.display = "none";
    }
};

function getExternalElement(elementID, linkID){
        let extern = document.getElementById(linkID).import;
        return extern.getElementById(elementID)
    }
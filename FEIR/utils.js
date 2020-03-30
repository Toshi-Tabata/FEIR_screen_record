

// doesn't work until we get over the CORS issue
function getExternalElement(elementID, linkID){
    let extern = document.getElementById(linkID).import;
    return extern.getElementById(elementID)
}
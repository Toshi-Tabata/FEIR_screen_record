import {BC_API_CONSTANTS} from "./constants/constants";

document.getElementById('menu_button').onclick = () => {
    showMenu();
};


// Get the modal
var modal = document.getElementById("building_id_modal");

// Get the button that opens the modal
var btn = document.getElementsByClassName("open_report_modal")[0];

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
let onclickButton = function() {
    modal.style.display = "block";
};
btn.addEventListener('click', onclickButton);

// When the user clicks on <span> (x), close the modal
const onclickClose = function() {
    modal.style.display = "none";
};
span.addEventListener('click', onclickClose);

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
};

var submitBID = document.getElementById("bid_form");
var buildingIDInput = <HTMLInputElement>document.getElementById("building_id_input");
submitBID.addEventListener('submit', function(event) {
    event.preventDefault();
    var buildingID = buildingIDInput.value;
    if (buildingID) {
        console.log(buildingID);
    }
    getPerformanceSolutions()
        .then(perfSols => {
            perfSols.filter(perfSol => perfSol.buildingIdentifier === buildingID);
            return perfSols;
        })
        .then(perfSolsByBuilding => {

        });
    buildingIDInput.value = '';
}, false);

function getPerformanceSolutions() {
    console.log("Getting performance solutions");
    return new Promise(() => {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                console.log(request.responseText);
                return request.responseText;
            }
        };
        var url = BC_API_CONSTANTS.BASE_URL + BC_API_CONSTANTS.API_URL + BC_API_CONSTANTS.PERF_SOL_ENDPOINT;
        request.open("GET", url, true);
        request.setRequestHeader("Content-Type", "application/json");
        request.setRequestHeader("Authorization", BC_API_CONSTANTS.AUTH_TOKEN);
        request.send();
    }).catch(err => {
        console.log("Failed to retrieve performance solutions");
        console.log(err);
    });

}
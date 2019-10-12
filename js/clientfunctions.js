"use strict" 
 
 function goBack() {
    window.history.back();
}

function searchStudent(){
    var xhttp = new XMLHttpRequest();
    var degree = document.getElementById("degree").value;
    xhttp.open("GET",'/findstudents?degree=' + degree,true);
    //xhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    xhttp.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) {
            document.getElementById("displayarea").innerHTML = this.responseText;
            setTimeout(function () {
                window.location.href = "index.html"
            }, 10000);
        }
    };
    xhttp.send();
}

function validateForm() {
    var filetype = document.getElementById("upload").files[0].type;
    var size = document.getElementById("upload").files[0].size;
    
    if(!(filetype == "image/jpeg" || filetype=="image/png") || size > 10000000) 
    {
        alert("File must be an image and be under 10mb");
        return false;
    }
}
//{
  //username:"jim",
  //password:"password",
  //roles:['user'] or maybe ['user','artist']
  //art:['art they created'] --> the art is stored in another thing, just treat this as a way to find it
  //notifications:[] --> all notifications: from who, discription/text
  //likes:[] --> all likes, maybe make it something like a pointer or store all the liked art in it
  //reveiwed:[] --> all reviewed, maybe make it something like a pointer or store
//}
let index;
function createAccount(){
    let req = new XMLHttpRequest();
    let name = document.getElementById("usernameCreate").value;
    let pass = document.getElementById("passwordCreate").value;
    let user = {};
    user.name = name;
    user.password = pass;
    user.roles = "Patron";
    user.art = [];
    user.notifications = [];
    user.followings = [];
    user.likes = [];
    user.reveiwed = [];
    user.madeLikes = [];
    user.isfollowing = [];
    user.WorkShop =[]
    req.onreadystatechange = function() {

        if(this.readyState==4 && this.status==200){
            alert("Saved");
            location.href = ("/");
            //switches to the vendor page
        }
    }
	//Send a POST request to the server containing the recipe data
	req.open("POST", `/createUser`);
	req.setRequestHeader("Content-Type", "application/json");
    //sends the object to the server
	req.send(JSON.stringify(user));
}

function loginAccount(){
    let req = new XMLHttpRequest();
    let name = document.getElementById("username").value;
    let pass = document.getElementById("password").value;
    let user = {};
    user.name = name;
    user.password = pass;
    req.onreadystatechange = function() {
        console.log(this.responseText);
        if(this.responseText == "check"){
            //change to new pug page
            location.href = ("/logined_in_user_page");
            //switches to the vendor page
        }else if(this.responseText == "unchecked" && this.readyState == 4){
            alert("Invalid");
            location.href = ("/");
            //switches to the vendor page
        }
    }
    //Send a POST request to the server containing the recipe data
    
        

    
	req.open("POST", `/login`);
	req.setRequestHeader("Content-Type", "application/json");
    //sends the object to the server
	req.send(JSON.stringify(user));
}


function getMeSlides(){
    index = 1;
    slidesShows();
}

function change(n){
    slidesShows(index +=n);
}


function slidesShows(n){
    let allSlides = document.getElementsByClassName("slide");
    if(n < 1){
        index = allSlides.length;
    }else if(n > allSlides.length){
        index = 1;
    }
    for(i = 0; i < allSlides.length; i++){
        allSlides[i]. style.display = "none";
    }
    allSlides[index - 1].style.display = "block";

}
// function slidesShows(){
//     let i;
//     let slides = document.getElementsByClassName("slide");
//     for(i = 0; i < slides.length; i++){
//         slides[i]. style.display = "none";
//     }
//     index++;
//     if(index > slides.length){
//         index = 1;
//     }
//     slides[index - 1].style.display = "block";
//     setTimeout(slidesShows, 3000);
// }
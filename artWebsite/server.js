
//mongod --dbpath=C:\Users\a-Justin\Downloads\Secondyear\2406\data


const express = require('express');
let app = express();

const fs = require("fs");
app.use(express.json()); 

//Database variables
let mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
let db;

let userLoggedIn = false;
//View engine
app.set("view engine", "pug");

app.use(express.static("public"));



const session = require("express-session");
const { networkInterfaces } = require('os');


//creates the cookies
app.use(session({secret: "my_secret",resave: true,saveUninitialized: true}));
session.userLoggedIn = false;
session.user={};
session.userLoggedIn = false;
//testing if it is working
app.use(function(req, res, next) {

    console.log(req.session);
    next();
})


//renders the main page
app.get("/", function(req, res,next){
  res.render("userMain");
});
//renders the add art page
app.get("/addArt", function(req, res, next){
    res.render("addArt",{check:null});

});
//renders the workshop page
app.get("/addWorkShop", function(req, res){
    res.render("addWorkShop");
});

//renders the create user page
app.get("/createUser", function(req, res,next){
  res.render("createUser");
  
});
//renders the profilePage
app.get("/profilePage", function(req, res, next){
    if(req.session.userLoggedIn == true){
        res.render("profilePage",{"user":req.session.user,"results": null});
    }else{
        res.status(404).send("Not logged in");
    }
})
//renders the art page where we see all the art
app.get("/logined_in_user_page", async function(req, res,next){
    let artwork = await db.collection("art").find().toArray();
    res.render("logined_in_user_page",{"art": artwork});
  });
//renders the login page
app.post("/login",async function(req,res,next){
    
    let userName = req.body.name;
    let userPassword = req.body.password;
    
    db.collection("user").findOne({$and: [{name: userName}, {password: userPassword}]},function(err, result){
        if(err){
            res.status(500);
        }else{
            //checks if there is already a user by that name
            if(result){
                    req.session.user = result;
                    req.session.userLoggedIn = true;
                    res.send("check");
                    
            }else{
                res.send("unchecked");
                
            }
        }
    });
});
    

//renders the create user page
app.post("/createUser",async function(req,res,next){
    let username = req.body.name;
    let name = await db.collection("user").find({name: username}).toArray();
    //checks if user already exists
    if(name.length<1){
        db.collection("user").insertOne(req.body, function(err, result){
			if(err){
				console.log("Error dropping collection. Likely case: collection did not exist (don't worry unless you get other errors...)")
			}else{
					console.log("Cleared user collection.");
                    res.status(200);
                    res.end();
			}
        });
    }else{
        res.send("unchecked");
    }

});
//loads the client
app.get("/client.js",(req,res,next)=>{
    fs.readFile("client.js",(err,data)=>{
            if(err){
                res.status(404);
                res.end("Server error")
                return
            }
            res.end(data);
        });
    });
//loads the specific art page 
app.get("/specific/:name", (req,res,next)=>{
    let name = req.params["name"];
    db.collection("art").findOne({name: name},function(err,result){
        if(err){
            res.status(404);
        }else{
            res.status(200).render("currentArt", {"art":result});
        }
    });
});

//adds a review to the art and also keeps track of the review on the user
app.get("/addReview/:name", (req,res,next)=>{

    let artName = req.params["name"];
    let review = req.query.review;
    if(req.session.userLoggedIn){
        db.collection("art").findOne({name: artName},function(err,result){
            if(err){
                res.status(404);
            }else{
                //chekcs if the user is making a review to their own art
                if(req.session.user.name != result.artist){
                    result.review.push({review: review, name: req.session.user.name});
                    db.collection("art").updateOne({name: artName}, {$set: {review: result.review}});
                    req.session.user.reveiwed.push({title:artName, reveiwTile: review});
                    db.collection("user").updateOne({name: req.session.user.name}, {$set:{reveiwed:  req.session.user.reveiwed}});
                    res.status(200).render("currentArt", {"art":result});
                }
            }
        });
    }else{
        res.status(404).send("Not logged in");
    }

})
//gets the art work with the give queries
app.get("/looking", async function(req, res){
    let name = req.query.Name;
    let artist = req.query.Artist;
    let catagory = req.query.Cataword
    db.collection("art").find({$or: [{name: name}, {artist: artist},{category:catagory}]}).toArray(function(err, result){
        res.render("profilePage",{"user":req.session.user,"results": result});
    });
});
//switches the user roles between Artist and patron
app.get("/switch", function(req, res){
    db.collection("user").findOne({name: req.session.user.name},function(err,result){
        if(result.roles == "Patron"){
            req.session.user.roles = "Artist";

            db.collection("user").updateOne({name: req.session.user.name},{$set:{roles:"Artist"}});
            res.render("profilePage",{"user":req.session.user,"results": null});

        }else{

            req.session.user.roles = "Patron";
            db.collection("user").updateOne({name: req.session.user.name},{$set:{roles:"Patron"}});
            res.render("profilePage",{"user":req.session.user,"results": null});

        }
    });

});
//loads the artist page
app.get("/artist/:name", function(req, res){
    let name = req.params.name;
    db.collection("user").findOne({name: name},function(err,result){
        db.collection("art").find({artist:result.name}).toArray(function(err,check){
            res.render("artistPage",{"user":result, "art":check});
        });
    });
});
//adds a like to the art and the user to keep track of it
app.get("/like/:name", function(req, res){
    let art = req.params.name;
    let check = -1;
    db.collection("art").findOne({name: art},function(err,result){
        //makes sure the user isnt liking their own art
        if(result.artist != req.session.user.name){
            //loops through and finds the artwork we liked, if it exists
            for(let i = 0;i<req.session.user.madeLikes.length;i++){
            
                if(req.session.user.madeLikes[i].artwork == art){
                    check = i;
                    break;
                }
            }
            //checks if the art exists, if it does we will remove it
            if(check >= 0){
                
                req.session.user.madeLikes.splice(check,1);

                db.collection("user").updateOne({name: req.session.user.name},{$set:{madeLikes:req.session.user.madeLikes}}); 
                result.likes.pop(check);
                db.collection("art").updateOne({name: art},{$set:{likes:result.likes}});
                db.collection("user").findOne({name: result.artist},function(err,artist){
                    console.log(artist);

                    artist.likes.pop(check);
                    db.collection("user").updateOne({name: artist.name},{$set:{madeLikes:artist.likes}});
                    res.status(200).render("currentArt", {"art":result});

                });

            }else{
                req.session.user.madeLikes.push({artwork:art,name:"liked"});
                db.collection("user").updateOne({name: req.session.user.name},{$set:{madeLikes:req.session.user.madeLikes}});

                result.likes.push(req.session.user.name);
                db.collection("art").updateOne({name: art},{$set:{likes:result.likes}});

                db.collection("user").findOne({name: result.artist},function(err,artist){
                    
                    artist.likes.push(req.session.user.name);
                    db.collection("user").updateOne({name: artist.name},{$set:{likes:artist.likes}});
                    res.status(200).render("currentArt", {"art":result});

                });
            
        }
    }
    });
});

//adds to the user and the users they want to follow
app.get("/follow/:name", function(req, res){
    let followingName = req.params.name;
    let check = -1;
    console.log(followingName);
    db.collection("user").findOne({name: followingName},function(err,result){
        //checks where in the array if it exists 
            for(let i = 0;i<req.session.user.isfollowing.length;i++){
                if(req.session.user.isfollowing[i].artistName == followingName){
                    check = i;
    
                    break;
                }
            }
            
            if(check >= 0){
                //removes from the arrays
                req.session.user.isfollowing.splice(check,1);

                db.collection("user").updateOne({name: req.session.user.name},{$set:{isfollowing:req.session.user.isfollowing}}); 
                

                result.followings.pop(check);
                db.collection("user").updateOne({name: result.name},{$set:{followings:result.followings}});
                db.collection("art").find({artist:result.name}).toArray(function(err,check){

                    res.render("artistPage",{"user":result, "art":check});
                });
    
    
            }else{
                //adds to the end of the following array
                req.session.user.isfollowing.push({artistName:followingName,name:"following"});
                db.collection("user").updateOne({name: req.session.user.name},{$set:{isfollowing:req.session.user.isfollowing}});
                //adds a notification to the user
                req.session.user.notifications.push({artist: followingName,name:"following"});
                db.collection("user").updateOne({name: req.session.user.name},{$set:{notifications:req.session.user.notifications}});

                //adds to the end of the following artist users array
                result.followings.push(req.session.user.name);
                db.collection("user").updateOne({name: result.name},{$set:{followings:result.followings}});
                db.collection("art").find({artist:result.name}).toArray(function(err,check){

                    res.render("artistPage",{"user":result, "art":check});
                });

            }
    });
});
//removes reviews that the user made to the artist and art
app.get("/removeReview/:review/:name", function(req, res){
    let reviewMade = req.params.review;
    let name = req.params.name;
    let checkart = -1;
    let checkuser = -1;
    db.collection("art").findOne({name: name},function(err,result){
        for(let i = 0; i < result.review.length; i++){
            if(result.review[i].review == reviewMade && result.review[i].name == req.session.user.name){
                checkart = i;
            }
        }
        for(let i = 0; i < req.session.user.reveiwed.length; i++){
            if(req.session.user.reveiwed[i].reveiwTile == reviewMade){
                checkuser = i;
            }
        }
        console.log(checkuser +"/"+checkart);
        if(checkuser >= 0 && checkart >= 0){
            console.log("here");
            req.session.user.reveiwed.splice(checkuser,1);
            db.collection("user").updateOne({name: req.session.user.name},{$set:{reveiwed:req.session.user.reveiwed}}); 
            

            result.review.splice(checkart,1);
           

            db.collection("art").updateOne({artist: result.artist},{$set:{review:result.review}});
            res.render("profilePage",{"user":req.session.user,"results": null});

          
        }else{
            res.render("profilePage",{"user":req.session.user,"results": null});

        }
    });
});
//removes likes that the user has made
app.get("/removeLikes/:name", function(req, res){
    let name = req.params.name;
    let check = -1;
    console.log(name);
    db.collection("art").findOne({name: name},function(err,result){
        for(let i = 0; i < req.session.user.madeLikes.length;i++){
            if(req.session.user.madeLikes[i].artwork == name){
                check = i;

            }
        }
        if(check >= 0){
            req.session.user.madeLikes.splice(check,1);
            db.collection("user").updateOne({name: req.session.user.name},{$set:{madeLikes:req.session.user.madeLikes}}); 
            db.collection("user").findOne({name: result.artist},function(err,artist){
                console.log(artist);
                console.log(artist.likes);

                artist.likes.pop(check);
                console.log(artist.likes);

                db.collection("user").updateOne({name: artist.name},{$set:{likes:artist.likes}});
                res.render("profilePage",{"user":req.session.user,"results": null});

            });
        }else{
            res.render("profilePage",{"user":req.session.user,"results": null});

        }

    });
});
//adds art work to the collection of art work, with the following queries
app.get("/addArtWork", function(req, res){
    let check = 0;
    let newart = {name: req.query.Name, artist: req.query.Artist,year: req.query.Year, category: req.query.Category,medium: req.query.Medium, description: req.query.Description, image:req.query.Image,review:[],likes:[]};
    
    db.collection("art").findOne({name: req.query.Name},function(err,artist){
        if(artist){
            res.render("addArt",{check:1});

    }else{
        db.collection("art").insertOne(newart, function(err, result){
            for(let i = 0; i < req.session.user.isfollowing.length; i++){
                if(req.session.user.isfollowing[i].artistName == req.query.Artist){
                    check = 1;
                }
            }
            if(check == 1){
                req.session.user.notifications.push({artist: req.query.Artist,name:"The following artist added art"});
                db.collection("user").updateOne({name: req.session.user.name},{$set:{notifications:req.session.user.notifications}});
            }
        });
        res.render("addArt",{check:null});

    }
    });
});
//adds a workShop to the events
app.get("/addWork",function(req, res){
    let newWork = {title: req.query.Title, date: req.query.Date, name: req.query.Name};
    db.collection("user").findOne({name: req.query.Name},function(err,artist){
        if(artist){
            artist.WorkShop.push(newWork);
            db.collection("user").updateOne({name: artist.name},{$set:{WorkShop:artist.WorkShop}});

            req.session.user.notifications.push({artist: req.query.Artist,name:"The following artist added a work shop"});
            db.collection("user").updateOne({name: req.session.user.name},{$set:{notifications:req.session.user.notifications}});
            res.render("addWorkShop");

        }

    });


})
//sets up mongodb
MongoClient.connect("mongodb://127.0.0.1:27017/", { useNewUrlParser: true }, function(err, client) {
  if(err) throw err;


  //Get the t8 database
  db = client.db('artists');


  // Start server once Mongo is initialized
  app.listen(3000);
  console.log("Listening on port 3000");
});

// vendor library
var passport = require('passport');
var bcrypt = require('bcrypt-nodejs');
var mysql      = require('mysql');
var sync = require('sync');
var moment = require('moment');
// custom library
// model
var Model = require('./model');
// var connection = mysql.createConnection({
// 	 host     : 'ediss.ckhbt5h3z4bl.us-east-1.rds.amazonaws.com',
// 	 user     : 'preethiaws',
// 	 password : 'preethiaws',
// 	 database : 'ediss'
//  });
var connection = mysql.createConnection({
	 host     : 'localhost',
	 user     : 'root',
	 password : 'root',
	 database : 'dbUsers'
 });
 var activeSession = false;
 var activeUser = {'usertype':""};

 connection.connect();

// index
var index = function(req, res, next) {
	 if(!req.isAuthenticated()) {
			res.redirect('/signin');
	 } else {

			var user = req.user;

			if(user !== undefined) {
				 user = user.toJSON();
			}
			res.render('index', {title: 'Home', user: user});
	 }
};

var updateInfo = function(req,res,next){
	 if(!req.isAuthenticated()){
			res.redirect('/login');
	 }
	 else{
			var user = req.user;
			if(user !== undefined){
				 user = user.toJSON();
			}
			res.render('updateInfo',{title:'Update Contact Info', user:user});
	 }
};

var checkActiveSessions = function(req){
	console.log("checking");
	var query = "Select * from tblUsers WHERE session_id is not null and ip_addr = '"+req.connection.remoteAddress+"'";
	console.log(query);
			 connection.query(query,function(err,rows){
			 if(err){
				 res.json({"message":"There was a problem with this action!"});
						   	}
			 if(rows > 0){
			 	activeSession = true;
			 	activeUser = row[0];
			 }
			 });
 return activeSession;
};
var updateInfoPost = function(req,res,next){
	var query = "Select * from tblUsers WHERE session_id is not null and ip_addr = '"+req.connection.remoteAddress+"'";
	console.log(query);
			 connection.query(query,function(err,rows){
			 if(err){
				 res.json({"message":"There was a problem with this action!"});
						   	}
			 else{
			 	if(rows.length > 0){
				 	console.log("checking inside");
			 		activeSession = true;
			 		activeUser = rows[0];
	    			console.log(activeUser);
			    }
			    updateInfoAuthenticated(req,res);
			 }
			 });
}
var updateInfoAuthenticated = function(req,res){
	if(!activeSession){
				res.json({ message: "You are not logged in!" });
			
	 }
	 else{
	 var user = req.body;
	 var usernamePromise = null;
	 console.log(user.userId);
	 usernamePromise = new Model.User({uName:req.session.username}).fetch();
     console.log(req.query);
	 return usernamePromise.then(function(model) {
			if(model) {
				 console.log("update info");
				 var query = "UPDATE tblUsers set fName= '"+req.body.fName+"', email ='"+req.body.email+"' WHERE userId='"+user.userId+"'";
				 
				 //connection.query('UPDATE tblUsers SET fName = ? WHERE userId = ?', [user.fName, user.userId]);
				console.log(query);
				connection.query(query, function (err, result) {
				
				if(!err){
						console.log("Response recorded");
						 res.json({ message: "Your information has been updated" });

				}
				else{
					res.json({ message: "There was a problem with this action!!!" });
				}
				});
				 // usernamePromise.set('lName', user.lName);
				 // usernamePromise.set('fName', user.fName);
				 // usernamePromise.save().then(function(model) {
				 //    console.log("in save");
				 //    // sign in the newly registered user
				 //    signInPost(req, res, next);
				 // });   
			} else {
				 //****************************************************//
				 // MORE VALIDATION GOES HERE(E.G. PASSWORD VALIDATION)
				 //****************************************************//
			 res.json({ message: "There was a problem with this action!!!" });
			}
	 });
}
};

// sign in
// GET
var signIn = function(req, res, next) {
	 if(req.isAuthenticated()) res.redirect('/');
	 res.render('signin', {title: 'Sign In'});
};

// sign in
// POST
var signInPost = function(req, res, next) {
	 passport.authenticate('local', { successRedirect: '/',
													failureRedirect: '/signin'}, function(err, user, info) {
			if(err) {
				 //return res.render('signin', {title: 'Sign In', errorMessage: err.message});
				//sess=req.session;
				//console.log(sess.sessionID);
				res.json({ sessionID: sess.sessionID, menu: " Update Contact Information, Log out" })
			} 

			if(!user) {
				res.json({ errorMessage: info.message});
			}
			return req.logIn(user, function(err) {
				 if(err) {
						res.json({ errorMessage: info.message});
				 } else {
				 			console.log("*******");
						 console.log(req.connection.remoteAddress);
						 activeUser = user;
						 req.session.username = activeUser.uName;
						 req.session.usertype = activeUser.usertype;
						  var query = "UPDATE tblUsers set session_id= NULL, ip_addr = NULL WHERE ip_addr='"+req.connection.remoteAddress+"'";
						   connection.query(query,function(err,rows){
						   	if(err){
						   		 res.json({
                       			 "message":"There was a problem with this action!"       
                    			 });
						   	}
						   });
						 var query = "UPDATE tblUsers set session_id= '"+req.sessionID+"' , ip_addr = '"+req.connection.remoteAddress+"' WHERE uName='"+user.uName+"'";
           				 connection.query(query,function(err,rows){
               			 console.log(query);
                		 if(err)
                   			 res.json({
                       			 "message":"There was a problem with this action!"       
                    		});
               			
            			 else {
            			 activeSession = true;
						 if(req.session.usertype == "admin"){
						 	var menu_items = "/getProducts, /viewUsers, /modifyProducts, /logOut, /updateInfo";
						 }
						 else{
						 	var menu_items = "/getProducts , /updateInfo, /logout";
						 }
						 res.json({ sessionID: req.sessionID, menu: menu_items});
						 }
						 });
						 }
				 
			});
	 })(req, res, next);
};


// sign up
// GET
var signUp = function(req, res, next) {
	 if(req.isAuthenticated()) {
			res.redirect('/');
	 } else {
			res.render('signup', {title: 'Sign Up'});
	 }
};

var validateRequest = function(user){
	var valid = true;
	var reg = /^\d+$/;
	var pattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
	
	if(user.username == undefined || user.lname == undefined || user.state == undefined || 
	 	user.zip == undefined || user.password == undefined || user.fname == undefined || 
	 	user.address == undefined|| user.city == undefined || user.email == undefined){
	 	valid = false;
	 }
	 else if(!pattern.test( user.email ) || user.state.length > 2 || user.zip.length > 5 || !(reg.test(user.zip)) ){
	 			valid = false;
	 }
	 else{

	 	var query = "Select * from tblUsers WHERE (lName= '"+user.lname+"' and fName = '"+user.fname+"') OR (uName = '"+user.username+"' and pWord = '"+user.password+"')";
		console.log(query);
		connection.query(query,function(err,rows){
		if(err){
			console.log("Error")
		}else{
			 if(rows.length > 0){
			 	valid = false;
			 	console.log(valid);
			 }

			 }
			 });
			 }
			 return valid;
	 }

	 

// sign up
// POST
var signUpPost = function(req, res, next) {
	 var user = req.body;
	 var usernamePromise = null;
	 var validated = validateRequest(user);
	 console.log(validated);
	 if(validated){
	 var signUpUser = new Model.User({uName: user.username, pWord: user.password, fName: user.fname, lName: user.lname,
																					address: user.address, city:user.city, state: user.state,email:user.email, 
																					zip:user.zip, usertype:user.usertype });
	 signUpUser.save().then(function(model) {
				res.json({ message:"Your account has been registered "});
					
	 });	
	 }
	 
	};
        
var viewUsers = function(req,res,next){
	//var CurrentDate = moment();
	console.log(moment().format());
	var query = "Select * from tblUsers WHERE session_id is not null and ip_addr = '"+req.connection.remoteAddress+"'";
	console.log(query);
			 connection.query(query,function(err,rows){
			 if(err){
				 res.json({"message":"There was a problem with this action!"});
						   	}
			 else{
			 	if(rows.length > 0){
				 	console.log("checking inside");
			 		activeSession = true;
			 		activeUser = rows[0];
			 		var startDate = moment(moment().format(), 'YYYY-M-DD HH:mm:ss z')
					var endDate = moment(rows[0].session_start, 'YYYY-M-DD HH:mm:ss z')
					var secondsDiff = startDate.diff(endDate, 'minutes')
					//console.log(startDate);
					//console.log(endDate);
					console.log(secondsDiff);
	    			//console.log(activeUser);
			    }
			    viewusers(req,res);
			 }
			 });
};

var getOrders = function(req,res,next){
	
	var query = "Select * from tblUsers WHERE session_id is not null and ip_addr = '"+req.connection.remoteAddress+"'";
			 connection.query(query,function(err,rows){
			 if(err){
				 res.json({"message":"There was a problem with this action!"});
						   	}
			 else{
			 	if(rows.length > 0){
				 	console.log("checking inside");
			 		activeSession = true;
			 		activeUser = rows[0];
			    }
			    get_orders(req,res);
			 }
			 });
};

function get_orders(req,res){
	if(!activeSession || activeUser.usertype != "admin"){
				res.json({ message: "You are not logged in as admin!" });			
	 }
	 else{
	 	var query = "select product_id as productId,count(*) as quantitySold from orders group by product_id";
	 	 connection.query(query,function(err,rows){
	 	 	if(err){
	 	 		 res.json({"message":"There was a problem with this action!"});
	 	 	}
	 	 	else{
	 	 		var output = JSON.stringify(rows);
                res.json({
	            	"orders":output,
	            	 "message" :"01 the request was successful"

	            });
	 	 	}
	 	 });
	 }
}
var buyProduct = function(req,res,next){
	
	var query = "Select * from tblUsers WHERE session_id is not null and ip_addr = '"+req.connection.remoteAddress+"'";
	console.log(query);
			 connection.query(query,function(err,rows){
			 if(err){
				 res.json({"message":"There was a problem with this action! - Session"});
						   	}
			 else{
			 	if(rows.length > 0){
				 	console.log("checking inside");
			 		activeSession = true;
			 		activeUser = rows[0];
			    }
			    buy_product(req,res);
			 }
			 });
};

function buy_product(req,res){
	if(!activeSession || activeUser.usertype != "admin"){
				res.json({ message: "You are not logged in as admin!" });			
	 }
	 else{
	 	var query = "Select stock_count from product where product_id="+req.body.productId
	 	console.log(query)
	 	connection.query(query,function(err,rows) {
	 		if(err) {
	 			res.json({"message" : "There was a problem with this action - Query"});
	 		}
	 		else{
	 			if(rows.length > 0){
	 				if(rows[0].stock_count > 0){
	 					var updated_count = rows[0].stock_count -1;
	 					var query = "update product set stock_count ="+updated_count+" where product_id ="+req.body.productId;
	 					connection.query(query,function(err,rows){
	 						if(err){
	 							res.json({"message" : "There was a problem with this action - stock count update"});
	 						}
	 						else{
	 							var query = "Insert into orders(product_id, quantity) values("+req.body.productId+","+1+")";
	 							console.log(query);
	 							connection.query(query,function(err,rows){
	 								if(err){
	 									res.json({"message" : "There was a problem with this action - insert into orders"});
	 								}
	 								else{
	 									res.json({"message" : "the purchase has been made successfully"});
	 								}

	 							});
	 							
	 						}
	 					});
	 				}
	 				else{
	 					res.json({"message" : "that product is out of stock"});
	 				}
	 			}
	 		}

	 	});
	 }

	 
}

function viewusers(req,res){

if(!activeSession || activeUser.usertype != "admin"){
				res.json({ message: "You are not logged in as admin!" });
			
	 }

	 else{
	 	 if(req.query.fname == undefined && req.query.lname == undefined){
	 	var query = "SELECT fName,lName from tblUsers";
	 }else{
	        var query = "SELECT fName,lName FROM ?? WHERE ?? LIKE ? OR ?? LIKE ?";
	 
        var table = [
	        "tblUsers",
	        "fName",
	        "%"+req.query.fname+"%",
	        "lName",
	        "%"+req.query.lname+"%"
        ];
        query = mysql.format(query,table);
    }
        connection.query(query,function(err,rows){
        	console.log(query);
            if(err) {
            	// console.log(query);
                res.json({
                	// "Error" : true, 
                	"errMessage" : "Database connection error!"
                });
            } else if(rows.length==0){
                res.json({
                	"errMessage" : "No such user!"
   			 	});
            }
            else if(rows.length>0){
                var output = JSON.stringify(rows);
                res.json({
	            	"user_list":output    	
	            });
            }
        });
    }
	// }
}

	// sign out
var signOut = function(req, res, next) {
	console.log("here!!00");
	//var activeSession = false;
	
	
	var query = "Select * from tblUsers WHERE session_id is not null and ip_addr = '"+req.connection.remoteAddress+"'";
	console.log(query);
			 connection.query(query,function(err,rows){
			 if(err){
				 res.json({"message":"There was a problem with this action!"});
						   	}
			 else{
			 	if(rows.length > 0){
				 	console.log("checking inside");
			 		activeSession = true;
			 		activeUser = rows[0];
	    			console.log(activeUser);
			    }
			    logout(req,res);
			 }
			 });
		

};

function logout(req,res){
	console.log("in log out");

	if(activeSession == false) {
			res.json({ message: "You are not currently logged in" });
	 } else {
			activeSession = false;
			 var query = "UPDATE tblUsers set session_id= NULL, ip_addr = NULL WHERE ip_addr='"+req.connection.remoteAddress+"'";
			 console.log(query);
			 connection.query(query,function(err,rows){
			 if(err){
				 res.json({"message":"There was a problem with this action!"});
						   	}
			 });
			 req.session.destroy();
			req.logout();
			res.json({ message: " You have been logged out" })
		 // res.redirect('/signin');
	 }
}
// 404 not found
var notFound404 = function(req, res, next) {
	 res.status(404);
	 res.render('404', {title: '404 Not Found'});
};
var getProducts = function(req, res, next){
	if(req.query.productId == undefined && req.query.category == undefined && req.query.keyword == undefined){
		var query = "select * from product inner join product_category_mapping";
	}
	else{
	var query = "SELECT distinct p.title FROM product p INNER JOIN product_category_mapping c ON p.product_id = c.product_id WHERE p.product_id = "+req.query.productId+" OR category LIKE '"+req.query.category+"' OR (title LIKE '"+req.query.keyword+"' OR description LIKE '"+req.query.keyword+"')";
       } 
       connection.query(query,function(err,rows){
        	console.log(query);
            if(err) {
            	console.log(query);
                res.json({
                	// "Error" : true, 
                	"errMessage" : "Database connection error!"
                });
            } else if(rows.length==0){
                res.json({
                	"errMessage" : "No such product!"
   			 	});
            }
            else if(rows.length>0){
                var output = JSON.stringify(rows);
                res.json({
	            	"product_list":output    	
	            });
            }
        });
    	// }
};
var modifyProduct = function(req, res, next){
	var query = "Select * from tblUsers WHERE session_id is not null and ip_addr = '"+req.connection.remoteAddress+"'";
	console.log(query);
			 connection.query(query,function(err,rows){
			 if(err){
				 res.json({"message":"There was a problem with this action!"});
						   	}
			 else{
			 	if(rows.length > 0){
				 	console.log("checking inside");
			 		activeSession = true;
			 		activeUser = rows[0];
	    			console.log(activeUser);
			    }
			    modifyProductAuthenticated(req,res);
			 }
			 });
}
var modifyProductAuthenticated = function(req, res, next){
	if(!activeSession || activeUser.usertype != "admin"){
				res.json({ message: "You are not logged in as admin!" });
			
	 }
	 else{
 var mess;
       // if(req.session.userType=="admin") {
            var query = "UPDATE product set title= '"+req.body.productTitle+"', description ='"+req.body.productDescription+"' WHERE product_id='"+req.body.productId+"'";
            connection.query(query,function(err,rows){
                console.log(query);
                if(err)
                    res.json({
                        "message":"There was a problem with this action!"       
                    });
                else
                    res.json({
                        "message":"The product information has been updated!"       
                    });
            }); 
        }
       // }
        // else {
        //     res.json({
        //                 "message":"There was a problem with this action!"       
        //     });
        // }
};


// export functions
/**************************************/
// index
module.exports.index = index;

// sigin in
// GET
module.exports.signIn = signIn;
// POST
module.exports.signInPost = signInPost;
module.exports.getProducts = getProducts;
// sign up
// GET
module.exports.signUp = signUp;
// POST
module.exports.signUpPost = signUpPost;

// sign out
module.exports.signOut = signOut;
module.exports.buyProduct = buyProduct;
module.exports.getOrders = getOrders;

// 404 not found
module.exports.notFound404 = notFound404;

module.exports.updateInfo = updateInfo;
module.exports.updateInfoPost = updateInfoPost;
module.exports.viewUsers = viewUsers;
module.exports.modifyProduct = modifyProduct;

const { response } = require('express');
var express = require('express');
const { default: monk } = require('monk');
var router = express.Router();

router.get('/loadpage', function(req, res){
    var category=req.query.category;
    var searchstring=req.query.searchstring;
    var db=req.db;
    var col=db.get("productCollection");
    var searchdict={}
    if (category!==""){
        searchdict.category=category
    }
    if (searchstring!==""){searchdict.name={$regex: searchstring, $options: 'i'}}
    col.find(searchdict, {sort: {"name":1}}, {_id:1, name:1, price:1, productImage:1}).then((docs, e)=>{
        res.json(docs);
    })
})

router.get("/loadproduct/:id", (req, res)=>{
    var db=req.db
    var prodcol=db.get("productCollection")
    // console.log(req.params.id)
    // console.log("Hello")
    prodcol.find({'_id': req.params.id}, {manufacturer: 1, description: 1}).then((docs, e)=>{
        res.json(docs[0])
    })
})

router.post("/signin", (req, res)=>{
    var username=req.body.username;
    var passwd=req.body.password;
    var db=req.db;
    var userscol=db.get('userCollection');
    userscol.find({"name": username, "password": passwd}, function(err, docs){
        if (err||docs.length===0){
            res.send("Login failure")
        } else {
            res.cookie("userID", docs[0]._id)
            res.send("Logged in!")
    }})
})

router.get("/signout", (req, res)=>{
    if (req.cookies.userID){
        res.clearCookie('userID');
        res.send("Logged out")
    } else {
        res.send("logout failed");
    }
})

router.get("/getsessioninfo", (req, res)=>{
    var db=req.db;
    var col=db.get("userCollection");
    if (req.cookies.userID){
        // console.log("Cookies found")
        col.find({_id: req.cookies.userID}, function(err, docs){
            // console.log("Server getsession")
            // console.log(err)
            console.log(docs[0])
                if (err || docs.length===0){
                    res.send("No such user")
                } else {
                    res.json({
                        "username": docs[0].name,
                        "totalnum":docs[0].totalnum,
                    })
                }
        })
    } else {
        console.log("No cookies found")
        res.send("N/A")
    }
})

router.put("/addtocart", (req, res)=>{
    var usercol=req.db.get("userCollection")
    if (req.cookies.userID){
        usercol.find({"_id": monk.id(req.cookies.userID), "cart.productID": monk.id(req.body.productID)}, 
        function(err, docs){
            if (docs){
                if(docs.length==0){
                    usercol.update(
                        {"_id": monk.id(req.cookies.userID)},
                        {$push:{
                            "cart": {"productID":monk.id(req.body.productID), "quantity": parseInt(req.body.quantity)}
                        },
                        $inc:{"totalnum": parseInt(req.body.quantity)}
                    },
                    function(err, docs){
                        if (docs){
                            usercol.find({"_id":monk.id(req.cookies.userID)}, function(err, docs){
                                if (docs){
                                    res.send(JSON.stringify(docs[0].totalnum))
                                } else {res.send(err)}
                            })
                        } else(res.send(err))
                    })
                }else{
                    usercol.update(
                        {"_id": monk.id(req.cookies.userID), "cart.productID": monk.id(req.body.productID)},
                        {$inc:{
                            "totalnum": parseInt(req.body.quantity), 
                            "cart.$.quantity":parseInt(req.body.quantity)
                        }
                    },
                    function(err, docs){
                        if (docs){
                            usercol.find({"_id":monk.id(req.cookies.userID)}, function(err, docs){
                                if(docs){
                                    console.log(docs)
                                    res.send(JSON.stringify(docs[0].totalnum))
                                } else {res.send(err)}
                            })
                        } else(res.send(err))
                    })
                }
            }
        })  
    }
})

router.get("/loadcart", (req, res)=>{
    var col=req.db.get("userCollection")
    col.aggregate([
        {$match: {_id: monk.id(req.cookies.userID)}},
        {$lookup: {
                from: "productCollection",
                localField: 'cart.productID',
                foreignField: "_id",
                as: "product"}},
    ], function(err, docs){
        // console.log("Loadcart")
        // console.log(docs)
        // console.log(err)
        if (err){
            res.send(err)
        } else{
            res.json(docs[0])
        }    
    })
})

//still have to figure out how to update totalnum
router.put("/updatecart", (req, res)=>{
    var col=req.db.get("userCollection")
    // console.log(req.body.diff)
    // col.find({"_id": monk.id(req.cookies.userID), "cart.productID": monk.id(req.body.productID)},)
    col.update(
        {"_id": monk.id(req.cookies.userID), "cart.productID": monk.id(req.body.productID)},
        {$set:{"cart.$.quantity":parseInt(req.body.quantity)}},
        function(err, docs){
            // console.log(docs)
            if(docs){
                col.find({"_id":monk.id(req.cookies.userID)}, function(err, docs){
                    if(docs){
                        var newTotalnum=docs[0].cart.reduce((sum, e)=> sum+e.quantity, 0);
                        col.update({"_id": monk.id(req.cookies.userID)},
                            {$set:{"totalnum":newTotalnum}}, function(err, docs){
                                if(docs) {res.send(JSON.stringify(newTotalnum))}
                            })
                    } else res.send(err)
                })
            } else{res.send(err)}
        }
    )
})

router.delete("/deletefromcart/:productID", (req, res)=>{
    var col=req.db.get('userCollection')
    // console.log(req.params.productID)
    // console.log("UserID")
    // console.log(req.cookies.userID)
    col.find(
        {"_id": monk.id(req.cookies.userID), "cart.productID": monk.id(req.params.productID)},
        function(err, docs){
            // console.log(docs[0])
            var i;
            for (i=0; i<docs[0].cart.length; i++){
                if (docs[0].cart[i].productID==req.params.productID){
                    var deletenum=docs[0].cart[i].quantity;
                    // var newTotalnum=docs[0].cart[i].reduce((sum, e)=> sum+e.quantity, 0)
                    col.update({"_id": monk.id(req.cookies.userID)},
                        {$pull:{cart: {"productID": monk.id(req.params.productID)}},
                        $inc:{totalnum: -parseInt(deletenum)}}, 
                        function(err, docs){
                            // console.log(err)
                            // console.log(docs)
                            if(docs){
                                col.find({"_id": monk.id(req.cookies.userID)},
                                        function(err, docs){
                                            if(docs){
                                                res.send(JSON.stringify(docs[0].totalnum))
                                            } else {res.send(err)}
                                        })
                            } else{res.send(err)}})
                }
            }
            // col.update({"_id": monk.id(req.cookies.userID)},
            // {$pull:{cart: {"productID": monk.id(req.params.productID)}}}, function(err, docs){
            //     console.log(err)
            //     console.log(docs)
            //     if(docs){res.status(200);res.send()} else{res.send(err)}})
        }
    )
    
})

router.get("/checkout", (req, res)=>{
    var col=req.db.get("userCollection")
    col.update({_id: req.cookies.userID},
        {$set: {cart:[], totalnum:0}}, function(e, r){res.send((e===null)? "": e)})
})

module.exports =  router;

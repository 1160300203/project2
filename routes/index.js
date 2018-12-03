var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render("index");
});

router.post("/verifyLogin", function(req, res, next){
    if(req.session.username) {
        return res.send({msg: ""});
    }
    var username = req.body.username;
    if(username != null){
        req.login.findById(username, function (err, result) {
            if(err){
                return res.send({msg: err});
            }else if(result.PW === req.body.password){
                req.session.username = username;
                return res.send({msg: ""});
            }else{
                return res.send({msg: "invalid"});
            }
        })
    }else{
        return res.send({msg: "invalid"});
    }
});

router.post("/create", function (req, res, next) {
    var username = req.body.username;
    if(username){
        req.login.findById(username, function (err, result) {
            if(err){
                res.send({msg: err});
            }else if(result == null){
                var newUser = new req.login({
                    _id: username,
                    PW: req.body.password
                });
                newUser.save((err, result)=>{
                    res.send({msg: err == null ? "" : err});
                });
            }else{
                res.send({msg: "existed"});
            }
        });
    }

});

router.get("/buywelcome", function (req, res, next) {
    var username = req.session.username;
    if(username == null){
        res.send({msg: "invalid"});
    }else{
        var result = [];
        var cache = [];
        req.film.find().exec().then((films)=>{
            cache = films;
            const promises = films.map((film)=>req.broadCast.find({FilmId: film.id}));
            return Promise.all(promises);
        }).then((broadCasts)=>{
            for(var i=0; i<cache.length; i++){
                var obj = {};
                Object.assign(obj, cache[i]._doc, {broadCasts: broadCasts[i]});
                result.push(obj);
            }
            return new Promise(() => {
                res.json({msg: "", movies: result});
            })
        }).catch((e)=>{
            res.send({msg: "mongodb error: "+e});
        });
    }
});

router.get("/seatplantry", function (req, res, next) {

    var username = req.session.username, broadCastId = req.query.BroadCastId;

    console.log("e1");
    console.log(broadCastId);

    if(username == null){
        res.send({msg: "invalid"});
    }else {
        var broadCast = {}, house = {}, film = {}, seats = [];
        req.broadCast.findById(broadCastId).exec().then((broadcast) => {
            Object.assign(broadCast, broadcast._doc);
            var FilmId = broadcast.FilmId;
            return req.film.findById(FilmId);
        }).then((f)=>{
            Object.assign(film, f._doc);
            var HouseId = broadCast.HouseId;
            return req.house.findById(HouseId);
        }).then((h)=>{
            Object.assign(house, h._doc);
            return req.ticket.find({BroadCastId: broadCastId});
        }).then((s)=>{
            seats = s.slice();
            return new Promise(()=>{
                res.json({msg: "", broadCast: broadCast, house: house, film: film, seats: seats});
            });
        }).catch(e=>{
            res.send({msg: "mongodb error: "+e});
        });
    }

});

router.get("/logout", function (req, res, next) {
    var username = req.session.username;
    if(username == null){
        res.send({msg: "invalid"});
    }else{
        req.session.destroy(function () {
            res.send({msg: ""});
        });
    }
});

module.exports = router;

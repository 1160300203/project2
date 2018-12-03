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
            seats = seats.map(x=>{
                return x.SeatNo;
            });

            console.log("e5");
            console.log(seats);

            return new Promise(()=>{
                res.json({msg: "", broadCast: broadCast, house: house, film: film, seats: seats});
            });
        }).catch(e=>{
            res.send({msg: "mongodb error: "+e});
        });
    }

});

router.post("/confirm", function (req, res, next) {

    console.log("e2");

    var username = req.session.username;
    if(username == null){
        res.send({msg: "invalid"});
    }else{
        var seatsNo = JSON.parse(req.body.SeatNo), broadCastId = JSON.parse(req.body.BroadCastId);
        var ticketsType = JSON.parse(req.body.TicketType);
        var ticketsFee = JSON.parse(req.body.TicketsFee);
        var promises = [];
        for(var i=0; i<seatsNo.length; i++){
            var ticket = new req.ticket({
                SeatNo: seatsNo[i],
                BroadCastId: broadCastId,
                Valid: true,
                UserId: username,
                TicketType: ticketsType[i],
                TicketFee: ticketsFee[i]
            });
            promises.push(ticket.save());
        }
        Promise.all(promises).then(()=>{
            res.send({msg: ""});
        }).catch(e=>{
            res.send({msg: "mongodb error: "+e});
        })
    }
});

router.get("/comment", function (req, res, next) {
    var username = req.session.username;
    if(username == null){
        res.send({msg: "invalid"});
    }else{
        req.film.find().exec().then(films =>{
            var filmNames = films.map((film)=>{
                return film.FilmName;
            });
            var filmIds = films.map((film)=>{
                return film._id;
            });
            res.send({msg: "", filmNames: filmNames, filmIds: filmIds});
        }).catch(e=>{
            res.send({msg: "mongodb error: "+e});
        })
    }
});

router.get("/comment_retrieve", function (req, res, next) {
    var username = req.session.username;
    if(username == null){
        res.send({msg: "invalid"});
    }else{
        var filmId = req.query.FilmId;
        req.comment.find({FilmId: filmId}).exec().then((comments)=>{
            var viewers = comments.map((comment)=>{
                return comment.UserId;
            });
            var contents = comments.map((comment)=>{
                return comment.Comment;
            });
            res.send({msg: "", viewers: viewers, comments: contents});
        }).catch(e=>{
            res.send({msg: "mongodb error: "+e});
        });
    }
});

router.post("/comment_submit", function (req, res, next) {
    var username = req.session.username;
    if(username == null){
        res.send({msg: "invaild"});
    }else{
        var filmId = req.body.FilmId, comment = req.body.Comment;

        console.log("e1");
        console.log(filmId);
        console.log(comment);

        var newComment = new req.comment({
            FilmId: filmId,
            UserId: username,
            Comment: comment
        });
        newComment.save((err)=>{
            if(err){
                res.send({msg: "mongodb error: " + err});
            }else{
                res.send({msg: ""});
            }
        });
    }
});

router.get("/history", function (req, res, next) {
    var username = req.session.username;

    console.log("e1");
    console.log(username);

    if(username == null){
        res.send({msg: "invalid"});
    }else{
        var ticketIds = [], houseIds = [], seatNos = [], filmNames = [], languages = [], dates = [], durations = [];
        var ticketFees = [], ticketTypes = [];
        req.ticket.find({UserId: username}).exec().then(tickets => {
            ticketIds = tickets.map(ticket => {
                return ticket._id;
            });
            seatNos = tickets.map(ticket => {
                return ticket.SeatNo;
            });
            ticketFees = tickets.map(ticket=>{
                return ticket.TicketFee;
            });
            ticketTypes = tickets.map(ticket=>{
                return ticket.TicketType;
            });
            var promises = tickets.map(ticket=>{
                return req.broadCast.findById(ticket.BroadCastId);
            });
            return Promise.all(promises);
        }).then(broadCasts => {
            houseIds = broadCasts.map(broadCast=>{
                return broadCast.HouseId;
            });
            dates = broadCasts.map(broadCast=>{
                return broadCast.Dates + "(" + broadCast.day + ") " + broadCast.Time;
            });
            var promises = broadCasts.map(broadCast=>{
                return req.film.findById(broadCast.FilmId);
            });
            return Promise.all(promises);
        }).then(films=>{
            filmNames = films.map(film=>{
                return film.FilmName;
            });
            languages = films.map(film=>{
                return film.Language;
            });
            durations = films.map(film=>{
                return film.Duration;
            });
            res.send({msg: "", ticketIds: ticketIds, houseIds: houseIds, seatNos: seatNos,
                filmNames: filmNames, languages: languages, dates: dates, durations: durations,
                ticketFees: ticketFees, ticketTypes:ticketTypes, username: username});
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

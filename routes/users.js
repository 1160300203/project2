var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get("/createaccount", function (req, res, next) {
    res.sendfile("../public/createaccount.html");
});

router.post("/verifyLogin", function(req, res, next){
    var user = req.session.user;
    if(user) {
        res.sendfile("main.html");
    }
    if(user){
        req.login.findById(user, function (err, result) {
            if(err){
                res.send({msg: err});
            }else{

                console.log(result);

            }
        })
    }
});

module.exports = router;

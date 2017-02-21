'use strict';

module.exports = function(context){
    contest.log("Boogie");
    context.res =  {
        status: 200,
        headers: {
            "Content-Type" : "application/json"
        },
        body : { "status" : "alive"}
    }
    context.done();
}

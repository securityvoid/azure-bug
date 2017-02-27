'use strict';

module.exports = function(context){
    context.log("Boogie");
    context.res =  {
        status: 200,
        headers: {
            "Content-Type" : "application/json"
        }
    }
    context.done();
}

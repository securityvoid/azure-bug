'use strict';

var q = require('q');
var path = require('path');
var cors_url = "https://www.google.com";

module.exports = function(context){
    getFiles(context, get400).then(createReport, get400).then(send200).catch(function(error){
        get400({ "action" : 'Catch', "context" : context, "error" : error});
    });
}

function send200(context){
    
    context.res.status = 200;
    context.res.headers["Access-Control-Allow-Credentials"] = "true";
    context.res.headers["Access-Control-Allow-Origin"] = cors_url;
    context.done();
}

function get400(response){
    response.context.res =  {
        status: 400,
        headers: {
            "Access-Control-Allow-Credentials" : true,
            "Access-Control-Allow-Origin" : cors_url,
            "Content-Type" : "application/json"
        },
        body : { message: "Improper Formatted Request"}
    };
    response.context.done();
}

function createReport(context){
    var deferred = q.defer();
    var xml2js = require('xml2js');
    var findings = new xml2js.Parser();

    var file = getFirstXmlFile(context.req.files);
    if(!file){
        deferred.reject({ success : false, action : "noXML", error : new Error("No XML File in Input"), context : context });
        return deferred.promise;
    }

    findings.parseString(file.contents, function (err, xml) {
        if(err) {
            deferred.reject({ success : false, action : "parseString", error : err, context : context });
            return deferred.promise;
        }

        context.res.headers = {
            "Content-Type" : "text/xml",
            //Temp commented out until this is allowed with Azure.
         //   "Content-Disposition": 'attachment; filename="' + file.fileName.replace(/[^a-zA-Z0-9\-_\.]/g,'') + '"'
            "Content-Disposition": 'attachment'
        };
        context.res.body = file.contents;
        deferred.resolve(context);
    });

    return deferred.promise;
}

function getFirstXmlFile(files){
    for (var fileRef in files) {
        if (files.hasOwnProperty(fileRef)) {
            var file = files[fileRef];
            if(file.type === "text/xml"){
                return file;
            }
        }
    }
    return null;
}


function getFiles(context){
    var deferred = q.defer();
    var files = {};
    try {
        //Work-Around for the fact Azure Functions don't pass Content-Type by default.
        if(!context.req.headers['content-type']){
            var contentType = /content-type:\s([^\r\n]+)/i.exec(context.bindingData.req)[1];
            context.req.headers["content-type"] = contentType;
        }

        var boundary = /boundary\s*=\s*"*([^;"]+)/i.exec(context.req.headers['content-type'])[1];
        var parts = context.req.body.split(boundary).map(function(r){return r.trim()});

        var regExDisposition = /content-disposition\s*:\s*([^;\s]+)\s*;*\s*/i;
        var regExType = /content-type\s*:\s*([^;\s]+)\s*;*\s*/i;
        var regExName = /\s*name="*([^";]+)"*\s*;*\s*/i;
        var regExFileName = /\s*filename\s*=\s*"*([^"$\r\n]+)"*;*\s*/i;

        var disposition = "", type = "", name = "", fileName ="";

        for(var i=0; i < parts.length; i++){
            var part = parts[i];
            if(part === '--')
                continue;
            if(regExDisposition.test(part) && regExType.test(part) && regExName.test(part) && regExFileName.test(part)){
                disposition = regExDisposition.exec(part)[1];
                type = regExType.exec(part)[1];
                name = regExName.exec(part)[1];
                fileName = regExFileName.exec(part)[1];
                var contents = part.replace(regExType,'').replace(regExName,'').replace(regExDisposition,'').replace(regExFileName,'').replace(/\r\n--$/, '').replace(/^\s+/, '').replace(/\s+$/,'');
                files[name + "_" + fileName] = {
                    disposition : disposition,
                    type : type,
                    name : name,
                    fileName : fileName,
                    contents : contents
                };
            }
        }
        context.req.files = files;
        deferred.resolve(context);
    } catch(error){
        deferred.reject({ success : false, action : "getFiles", error : error, context : context });
    }

    return deferred.promise;
}
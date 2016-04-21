/**
 * @type module 
 * @author qing
 * @time 2016-03-20
 * @desc desc util.js
 */
var fs  = require('fs')
  , sys = require('util');
exports.get = function(fileName, key){
	var configJson = {};
    try{
        var str = fs.readFileSync(fileName,'utf8');
        configJson = JSON.parse(str);
    }catch(e){
        sys.debug("JSON parse fails")
    }
    return configJson[key];
}
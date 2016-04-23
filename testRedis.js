/**
 * Created by qingz on 2016/4/22.
 */

var http = require("http");
var redis=require("redis");
var client = redis.createClient();
var i = 1;

http.createServer(
    function (request, response) {

        response.writeHead(200, {"Content-Type":"text/html; charset=UTF-8"});

        response.write("欢迎您第" + i + "次访问服务器！<br>Welcome!<br>");
        client.set(["demo2_key", "服务器访问被访问次数: i = " + i]);
        client.get(["demo2_key"], function(err, result){
            console.log(result);
            response.write(result);
            response.end();
        });
        ++i;
    }).listen(80);

console.log("服务器开启");

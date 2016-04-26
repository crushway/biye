/**
 * Created by qingz on 2016/4/24.
 */
var BaseModel = require('./base_model')
    , baseModel = new BaseModel()
var redis = require("redis");
var async = require("async");

var redisClient = redis.createClient();
redisClient.on('connect', function () {
    console.log('redisClient connected!');
});
var tempUrl=[];
//allCrawledUrl,unCrawledUrl,targetUrl,crawledUrl
// var allCrawledUrl=[],targetUrl=[],crawledUrl=[];
/*
async.series(




);
*/

/*redisClient.smembers('allCrawledUrl', function (err, result) {
    if(err){
        console.log("err!!!")
    }else{
        console.log('redis query ok!')

        baseModel.insertMult('allCrawledUrl', result);

    }
});*/
/*

redisClient.smembers('targetUrl', function (err, result) {
    if(err){
        console.log("err!!!")
    }else{
        console.log('redis query ok!')
        baseModel.insertMult('targetUrl', result);

    }
});
*/

/*
var inserSql=function () {
    redisClient.spop('allCrawledUrl', function (err, result) {
        if(err){
            console.log("err!!!")
        }else{
            // console.log('redis query ok!')
            baseModel.insert1('targetUrl', result);
            queryRedis()
        }
    });
   /!* redisClient.SRANDMEMBER('allCrawledUrl', function (err, result) {
        if(err){
            console.log("err!!!")
        }else{
            // console.log('redis query ok!')
            baseModel.insert1('target_url', result);
            queryRedis()
        }
    });*!/
}

var queryRedis=function () {
    redisClient.scard('allCrawledUrl', function (err, result) {
        if(err){
            console.log("err!!!")
        }else{
            console.log('redis query ok!'+result)
            if(result!=0){
                inserSql()
            }

        }
    });
*/

   /* redisClient.scard('allCrawledUrl', function (err, result) {
        if(err){
            console.log("err!!!")
        }else{
            // console.log('redis query ok!')
            if(result!=0){
                inserSql()
            }

        }
    });*/



/*

redisClient.smembers('crawledUrl', function (err, result) {
    if(err){
        console.log("err!!!")
    }else{
        baseModel.insertMult('crawledUrl', result);

    }
  
});
*/
/*redisClient.scard('targetUrl', function (err, result) {
    if(err){
        console.log("err!!!")
    }else{
        console.log('redis query ok!')
        if(result!=0){
            console.log('redis query ok!'+result)

        }

    }
});*/
/*redisClient.SRANDMEMBER('targetUrl', function (err, result) {
    if(err){
        console.log("err!!!")
    }else{
       console.log(result);

    }

});*/



/**
 * targetUrl插入数据库
 */


var inserSqlTargetUrl=function () {
    redisClient.spop('targetUrl', function (err, result) {
        if(err){
            console.log("err!!!")
        }else{
            // console.log('redis query ok!')
            tempUrl.push(result);
            if(tempUrl.length%10000==0){
                baseModel.insertUnique('targetUrl', tempUrl);
                tempUrl=[];
            }
            queryRedisTargetUrl()
        }
    });
    /* redisClient.SRANDMEMBER('allCrawledUrl', function (err, result) {
     if(err){
     console.log("err!!!")
     }else{
     // console.log('redis query ok!')
     baseModel.insert1('target_url', result);
     queryRedis()
     }
     });*/
}

var queryRedisTargetUrl=function () {
    redisClient.scard('targetUrl', function (err, result) {
        if (err) {
            console.log("err!!!")
        } else {
            console.log('redis query ok!' + result)
            if (result != 0) {
                inserSqlTargetUrl()
            }else{
                baseModel.insertUnique('targetUrl', tempUrl);

            }

        }
    });
}

/**
 * crawledUrl插入数据库
 */

var inserSqlCrawledUrl=function () {
    redisClient.spop('crawledUrl', function (err, result) {
        if(err){
            console.log("err!!!")
        }else{
            // console.log('redis query ok!')
            tempUrl.push(result);
            if(tempUrl.length%10000==0){
                baseModel.insertUnique('crawledUrl', tempUrl);
                tempUrl=[];
            }
            queryRedisCrawledUrl()
        }
    });
    /* redisClient.SRANDMEMBER('allCrawledUrl', function (err, result) {
     if(err){
     console.log("err!!!")
     }else{
     // console.log('redis query ok!')
     baseModel.insert1('target_url', result);
     queryRedis()
     }
     });*/
}

var queryRedisCrawledUrl=function () {
    redisClient.scard('crawledUrl', function (err, result) {
        if (err) {
            console.log("err!!!")
        } else {
            // console.log('redis query ok!' + result)
            if (result != 0) {
                inserSqlCrawledUrl()
            }else{
                baseModel.insertUnique('crawledUrl', tempUrl);
                queryRedisTargetUrl();
            }

        }
    });
}

/**
 * allCrawledUrl插入数据库
 */

var inserSqlAllCrawledUrl=function () {
    redisClient.spop('allCrawledUrl', function (err, result) {
        if(err){
            console.log("err!!!")
        }else{
            // console.log('redis query ok!')
            tempUrl.push(result);
            if(tempUrl.length%10000==0){
                baseModel.insertUnique('allCrawledUrl', tempUrl);
                tempUrl=[];
            }
            queryRedisAllCrawledUrl()
        }
    });
    /* redisClient.SRANDMEMBER('allCrawledUrl', function (err, result) {
     if(err){
     console.log("err!!!")
     }else{
     // console.log('redis query ok!')
     baseModel.insert1('target_url', result);
     queryRedis()
     }
     });*/
}

var queryRedisAllCrawledUrl=function () {
    redisClient.scard('allCrawledUrl', function (err, result) {
        if (err) {
            console.log("err!!!")
        } else {
            // console.log('redis query ok!' + result)
            if (result != 0) {
                inserSqlAllCrawledUrl()
            }else{
                baseModel.insertUnique('allCrawledUrl', tempUrl);
                queryRedisCrawledUrl();
            }
        }
    });
}
queryRedisAllCrawledUrl();
//
//
/**
 * Created by qingz on 2016/4/27.
 */
var request = require("superagent");
var cheerio = require("cheerio");
var async = require("async");
var path = require("path");
var fs = require("fs");
var redis = require("redis");
var http = require('http');
var redisClient = redis.createClient();
var prefix='';
redisClient.on('connect', function () {
    console.log('redisClient connected!');
});
var bfNumber = 20;


redisClient.del('unCrawledUrl', function (err, reply) {
    if (err) {
        console.log(err);

    }
    console.log(reply);
});

redisClient.del('cawledUrl', function (err, reply) {
    if (err) {
        console.log(err);

    }
    console.log(reply);
});
var array = ['http://detail.zol.com.cn/mid/index283799.shtml', 'http://detail.zol.com.cn/keep-monitoring/index933596.shtml', 'http://detail.zol.com.cn/webcams/index334076.shtml'];

redisClient.sadd('unCrawledUrl', array, function (err, reply) {
    if (err) {
        console.log(err);
    } else {
        console.log(reply);
        console.log("********************");
    }


});


/**
 * 从未爬取队列中获取要爬取的url，并把url放入已爬取队列
 * @returns {Array}
 */
var bingfa = function () {
    var temp = [];
    var flag = 0;
    for (var i = 0; i < 40; i++) {
        redisClient.spop('unCrawledUrl', function (err, result) {
            if (result != null) {
                console.log("=====");

                console.log(result);
                console.log(flag);
                temp.push(result);
            }
            count();
        })
    }
    function count() {
        flag++;
        if (flag == 40 && temp.length != 0) {
            console.dir(temp);

            redisClient.sadd('crawledUrl', temp, function (err, reply) {
                if (err) {
                    console.log(err);
                }
                redisClient.on('connect', function () {
                    console.log('redisClient connected!=====2');
                });
                console.log("进入并发url存入crawledUrl,共：" + reply);

                if (temp.length != 0) {
                    // 并发量控制为 10
                    //allCrawledUrl,uncrawledUrl,targetUrl,crawledUrl

                    redisClient.SCARD('allCrawledUrl', function (err, result) {
                        if (err) {
                            console.log(err);
                        }
                        console.log('总allCrawledUrl:' + result);
                    })
                    redisClient.SCARD('unCrawledUrl', function (err, result) {
                        if (err) {
                            console.log(err);
                        }
                        console.log('未爬取unCrawledUrl:' + result);
                    })
                    redisClient.SCARD('targetUrl', function (err, result) {
                        if (err) {
                            console.log(err);
                        }
                        console.log('目标targetUrl:' + result);
                    })
                    redisClient.SCARD('crawledUrl', function (err, result) {
                        if (err) {
                            console.log(err);
                        }
                        console.log('已爬crawledUrl:' + result);
                    })
                    if (temp.length < bfNumber) {
                        //最后需要爬取的url很少达不到并发数，需要改变并发数
                        var nowBingfa = temp.length;
                    } else {
                        var nowBingfa = bfNumber;
                    }
                    console.log('===========并发数为' + nowBingfa + '，进入并发查询=======')
                    async.mapLimit(temp, nowBingfa, function (url, callback) {
                        // if(url)
                        console.dir(url);
                        getUrlList(url, callback);
                    }, function (err, result) {
                        // res.send(result);
                        console.log(result);
                        bingfa();
                    });
                }
                // return temp;
            });

        }
    }
}
/**
    **
    * 获取每个url的里面的url
    * @param url
*/
var getUrlList = function (url, callback) {
    var reg = /\$http/;
    var target = /^\/\w.+index\d+\./;
    if (reg.exec(url) || url == null || url == 'undefined') {
        callback(null, "url错误：   " + url);

    } else {
        if (target.exec(url)) {
            redisClient.sadd('targetUrl', url, function (err, reply) {
                // console.log("targetUrl：" + reply);
            });
            getData(prefix + url, callback);
        } else {
            getUrls(prefix + url, callback);
        }
    }

}

/**
 * 获取页面url
 * @param url
 * @param callback
 */
var getUrls = function (url, callback) {
    var urlArray = [];
    request.get(url)
        .end(function (err, res) {
            if (err) {
                callback(null, "请求错误   " + url);
            } else {
                var $ = cheerio.load(res.text);
                $("a").each(function () {
                    urlArray.push($(this).attr("href"));
                });
                urlArray = handleUrl(urlArray);
                callback(null, "成功抓取URL   " + url);
            }
        });
}
/**
 * 获取网页正文信息
 * @param url
 * @param callback
 */
var getData = function (url, callback) {
    http.get(url, function (res) {
        var html = '';
        res.setEncoding('binary');
        res.on('data', function (data) {
            html += data;
        });
        res.on('end', function () {
            var str = iconv.decode(new Buffer(html, 'binary'), 'gbk');
            var info = {};
            var $ = cheerio.load(str);
            var something = $("div.breadcrumb a");
            async.series(
                [
                    function (cb) {
                        //类别
                        var product_category = $(something[1]).text().trim();
                        cb(null, product_category);
                    },
                    function (cb) {
                        //品牌
                        var product_brand = $(something[2]).text().trim();
                        cb(null, product_brand);

                    },
                    function (cb) {
                        //商品名称
                        if (something.length == 4) {
                            var product_name = $(".breadcrumb h1").text().trim();
                        } else {
                            var product_name = $(".page-title h1").text().trim();
                        }
                        if (!product_name) {
                            var product_name = $(".product-name").text().trim();
                        }
                        if (!product_name) {
                            var product_name = $(".breadcrumb span").text().trim();
                        }
                        cb(null, product_name);
                    },
                    function (cb) {
                        //商品描述
                        var product_desc = $(".subtitle").text().trim();
                        if (!product_desc) {
                            cb(null, '无');
                        }
                    },
                    function (cb) {
                        //价格
                        var product_price = $(".price-sign").next().text().trim();
                        if (!product_price) {
                            product_price = $(".price-type").text().trim();
                        }
                        cb(null, product_price);
                    }
                ], function (err, values) {
                    info.product_category = values[0];
                    info.product_brand = values[1];
                    info.product_name = values[2];
                    info.product_desc = values[3];
                    info.product_price = values[4];
                    info.product_url = url;
                }
            )
            callback(null, "成功抓取信息：   " + url);
        });
    }).on('error', function () {
        callback(null, "抓取错误：   " + url);

    });
}

bingfa();
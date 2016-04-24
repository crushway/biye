/**
 * Created by qingz on 2016/4/19.
 */
var request = require("superagent");
var cheerio = require("cheerio");
var async = require("async");
var path = require("path");
var fs = require("fs");
var redis = require("redis");

prefix = 'http://detail.zol.com.cn';
allUrl = [];//所有url
crawledUrl = [];//已爬取url
uncrawledUrl = [];//待爬取url
targetUrl = [];//目标商品页面

//allCrawledUrl,uncrawledUrl,targetUrl,crawledUrl

const bfNumber = 10;
var BaseModel = require('./base_model')
    , baseModel = new BaseModel()
    , rowInfo = {}
    , tableName = 'urls';
var indexUrl = 'http://detail.zol.com.cn/subcategory.html';
var config = {
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate, sdch",
    "Accept-Language": "zh-CN,zh;q=0.8,en;q=0.6",
    "Connection": "keep-alive",
    "Content-Length": "132",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Host": "detail.zol.com.cn",
    "Referer": "http://detail.zol.com.cn/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest"
};
// var urlArray=[];/*存储所有链接的数组*/
var redisClient = redis.createClient();
redisClient.on('connect', function () {
    console.log('redisClient connected!');
});
/*获取首屏所有URL链接*/
var getInitUrlList = function () {
    var urlArray = [];
    /*存储所有链接的数组*/
    //allCrawledUrl,unCrawledUrl,targetUrl,crawledUrl
    redisClient.del('allCrawledUrl', function (err, reply) {
        if (err) {
            console.log(err);

        }
        console.log(reply);
    });
    redisClient.del('unCrawledUrl', function (err, reply) {
        if (err) {
            console.log(err);

        }
        console.log(reply);
    });
    redisClient.del('targetUrl', function (err, reply) {
        if (err) {
            console.log(err);

        }
        console.log(reply);
    });
    redisClient.del('crawledUrl', function (err, reply) {
        if (err) {
            console.log(err);

        }
        console.log(reply);
    });
    request.get(indexUrl)
        .end(function (err, res) {
            if (err) {
                console.log(err);
            } else {
                var $ = cheerio.load(res.text);

                $("a").each(function () {
                    // console.log($(this).attr("href"));
                    urlArray.push($(this).attr("href"));
                });
                //url去重
                // urlArray = uniqueArrIndex(urlArray)

                //正则取出需要的url后放入reids集合unCrawledUrl中
                urlArray = handleUrlIndex(urlArray)

                // console.log("已成功抓取" + urlArray.length + "个种子URL");
                // console.dir(urlArray);

                //插入数据库
                // if (urlArray.length) {
                //     baseModel.insertUnique(tableName, urlArray);
                //
                // }
                /* redisClient.sadd('unCrawledUrl',urlArray, function(err, reply) {
                 console.log("插入数据："+reply);
                 });
                 redisClient.smembers('unCrawledUrl', function(err, reply) {
                 console.log(reply);
                 });*/

            }
        });
}

/**
 * 首页的url处理
 * @param arr
 * @returns {Array}
 */
var handleUrlIndex = function (arr) {
    var result = [], hash = {};
    var reg = /^\//;//正则取出商品链接或者翻页链接，开头是/的url，取完再拼接
    for (var i = 0, elem; (elem = arr[i]) != null; i++) {
        if (!hash[elem] && reg.exec(elem)) {
            hash[elem] = true;
            result.push(elem);
        }
        hash[elem] = true;
    }
    console.log(result.length != 0);
    if (result.length != 0) {
        //未爬取的url的集合
        redisClient.sadd('unCrawledUrl', result, function (err, reply) {
            console.log("redis插入数据unCrawledUrl：" + reply);
        });
        //所有的url的集合
        redisClient.sadd('allCrawledUrl', result, function (err, reply) {
            console.log("redis插入数据allCrawledUrl：" + reply);
        });
    }
    redisClient.scard('unCrawledUrl', function (err, result) {
        console.log("redis现有unCrawledUrl数据：" + result);
    });
    //进入并发控制请求url
    bingfa();
    return result;
}


/**
 *普通页面的url处理
 * @param arr
 * @returns {Array}
 */
var handleUrl = function (arr) {
    // console.log("进入url处理===================");
    var result = [], elem,flag=-1;
    var reg = /^\/\w.+\/+(index\d+|\d+)\./;//正则取出商品链接或者翻页链接,以/开头，结尾是index+数字或者数字再加点
    var regLarge = /^\/\w.+/; //所有开头是斜杠的url
    var target = /^\/\w.+index\d+\./;
    for (var i = 0; (elem = arr[i]) != null; i++) {
        // console.log(elem);
        if(reg.exec(elem)){
            redisClient.sismember('allCrawledUrl', elem, function (elem,err, reply) {
                if (err) {
                    console.log(err);
                }
                add1(elem,reply);
            }.bind(this,elem));
        }

        function  add1(elem,status) {
            // console.log("==================="+elem+"====================");

            if (status == 0) {
                result.push(elem);

                //所有的url的集合
                redisClient.sadd('allCrawledUrl', elem, function (err, reply) {
                    if (err) {
                        console.log(err);
                    }else{
                        add2(elem,reply);
                    }

                });
            }
        }
        function add2(elem,status) {
            // console.dir("=====================" + elem);

            if (status && target.exec(elem)) {
                redisClient.sadd('targetUrl', elem, function (err, reply) {
                    if (err) {
                        console.log(err);
                    }
                    // console.log("redis插入数据targetUrl：" + reply);


                });

            } else if(status) {
                //进入待爬取url
                redisClient.sadd('unCrawledUrl', elem, function (err, reply) {
                    if (err) {
                        console.log(err);
                    }
                    // console.log("redis插入数据unCrawledUrl：" + reply);
                });
            }

        }

    }

}

       /* if (reg.exec(elem)) {
            async.waterfall([
                function (callback) {
                    redisClient.sismember('allCrawledUrl', elem, function (err, reply) {
                        if (err) {
                            console.log(err);
                        }
                        console.dir("=====================" + elem);
                        callback(null, reply, elem);//没有存在返回0，去插入
                    });

                },
                function (status, elem, callback) {
                    // console.log("==================="+elem+"====================");

                    if (status == 0) {
                        result.push(elem);

                        //所有的url的集合
                        redisClient.sadd('allCrawledUrl', elem, function (err, reply) {
                            if (err) {
                                console.log(err);
                            }
                            callback(null, 0);
                        });
                    }
                    else {
                        callback(null, 1);

                    }
                },
                function (status, callback) {
                    if (status && target.exec(elem)) {
                        redisClient.sadd('targetUrl', elem, function (err, reply) {
                            if (err) {
                                console.log(err);
                            }
                            console.log("redis插入数据targetUrl：" + reply);
                            callback(null, reply);

                        });

                    } else {
                        //进入待爬取url
                        redisClient.sadd('unCrawledUrl', elem, function (err, reply) {
                            if (err) {
                                console.log(err);
                            }
                            console.log("redis插入数据unCrawledUrl：" + reply);
                            callback(null, reply);
                        });
                    }

                }
            ], function (err, result) {
                if (err) {
                    console.log('handleUrl err: ', err);
                } else {
                    console.log('handleUrl result: ', result);
                }
            });
        }
*/

        /*if (reg.exec(elem)) {
         redisClient.sismember('allCrawledUrl', elem, function (err, reply) {
         if (err) {
         console.log(err);
         }
         console.log(reply);
         if (reply == 0) {
         console.log("现在的url是：" + elem);
         addData();
         }
         })


         function addData() {
         // elem = elem + prefix;
         // console.log("进去url==========================================================================================")
         result.push(elem);
         //所有的url的集合
         redisClient.sadd('allCrawledUrl', elem, function (err, reply) {
         if (err) {
         console.log(err);
         }
         console.log("redis插入数据allCrawledUrl：" + reply + 'elem:' + elem);
         //存入目标商品url
         if (target.exec(elem)) {
         redisClient.sadd('targetUrl', elem, function (err, reply) {
         if (err) {
         console.log(err);
         }
         console.log("redis插入数据targetUrl：" + reply);
         return result;
         });

         } else {
         //进入待爬取url
         redisClient.sadd('unCrawledUrl', elem, function (err, reply) {
         if (err) {
         console.log(err);
         }
         // console.log("redis插入数据unCrawledUrl：" + reply);

         // return result;
         });
         }
         });

         }


         }*/

/**
 * 从未爬取队列中获取要爬取的url，并把url放入已爬取队列
 * @returns {Array}
 */
var bingfa = function () {
    var temp = [];
    var flag = 0;
    for (var i = 0; i < 40; i++) {

            redisClient.spop('unCrawledUrl', function (err, result) {
                if(result!='nil'){
                    temp.push(result);
                    count();
                }

            })
        }

    function count() {
        flag++;
        if (flag == 40) {
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
                    if(temp.length<10){
                        //最后需要爬取的url很少达不到并发数，需要改变并发数
                        var nowBingfa=temp.length;
                    }else{
                        var nowBingfa=bfNumber;
                    }
                    console.log('===========并发数为' + nowBingfa + '，进入并发查询=======')
                    async.mapLimit(temp, nowBingfa, function (url, callback) {
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
 * 获取每个url的里面的url
 * @param url
 */
var getUrlList = function (url, callback) {
    var urlArray = [];
    // console.log("当前url" + prefix + url);
    /* if (in_array(url, crawledUrl)) {
     callback(null, "已经抓取过的url  " + url);
     return;
     }*/
    var reg=/http/;
    if(reg.exec(url)||url==null||url=='undefined'){
        callback(null, "url错误：   " + url);

    }else{
        request.get(prefix + url)
            .end(function (err, res) {
                if (err) {
                    console.log("请求url时出错");
                    callback(null, "请求错误   " + url);
                } else {
                    var $ = cheerio.load(res.text);

                    $("a").each(function () {
                        urlArray.push($(this).attr("href"));
                    });
                    // urlArray = uniqueArr(urlArray);
                    /* async.series([
                     urlArray = handleUrl(urlArray),
                     callback(null, "成功抓取" + urlArray.length + "个需要URL      " + url)
                     ]);*/
                    urlArray = handleUrl(urlArray);
                    callback(null, "成功抓取URL   " + url);
                    // console.dir(urlArray);
                    //插入数据库
                    /*if (urlArray.length) {
                     baseModel.insertUnique(tableName, urlArray);

                     }*/

                }
            });
    }
    /*存储所有链接的数组*/
   /* request.get(prefix + url)
        .end(function (err, res) {
            if (err) {
                console.log(err);
            } else {
                var $ = cheerio.load(res.text);

                $("a").each(function () {
                    urlArray.push($(this).attr("href"));
                });
                // urlArray = uniqueArr(urlArray);
                /!* async.series([
                 urlArray = handleUrl(urlArray),
                 callback(null, "成功抓取" + urlArray.length + "个需要URL      " + url)
                 ]);*!/
                urlArray = handleUrl(urlArray);
                callback(null, "成功抓取URL   " + url);
                // console.dir(urlArray);
                //插入数据库
                /!*if (urlArray.length) {
                 baseModel.insertUnique(tableName, urlArray);

                 }*!/

            }
        });*/
}

/**
 * 判断元素是否在数组中
 * @param stringToSearch
 * @param arrayToSearch
 * @returns {boolean}
 */
var in_array = function (stringToSearch, arrayToSearch) {
    var thisEntry;
    for (var s = 0; s < arrayToSearch.length; s++) {
        thisEntry = arrayToSearch[s].toString();
        if (thisEntry == stringToSearch) {
            return true;
        }
    }

    return false;
}

/**
 * 数据库的查找
 * @param number
 */
var searchInMysql = function (number) {
    var sql = 'SELECT * FROM ' + tableName + ' limit' + number;

    console.log("---------------");
    console.log(sql);

    baseModel.query(sql, function (ret) {
        console.log(ret);
    });
}

/**
 * 去除首页数组中的重复项
 * @param arr
 * @returns {Array}
 */
var uniqueArrIndex = function (arr) {
    var result = [], hash = {};
    var reg = /^\//;//正则取出商品链接或者翻页链接，开头是/的url，取完再拼接
    for (var i = 0, elem; (elem = arr[i]) != null; i++) {
        if (!hash[elem] && reg.exec(elem)) {
            if (!in_array(elem, uncrawledUrl)) {
                result.push(prefix + elem);
                uncrawledUrl.push(prefix + elem);
                allUrl.push(prefix + elem);
                hash[elem] = true;
            }
        }
    }
    bingfa();

    return result;
}


/**
 * 控制并发
 */
var bingfa1 = function () {

    var urls = getUrls();
    // console.log('urls number:' + urls.length + ', uncrawledUrl number: ' + uncrawledUrl.length + ', allUrl number: ' + allUrl.length + ',target number:' + targetUrl.length + ',crawledUrl:' + crawledUrl.length);
    if (urls.length != 0) {
        // 并发量控制为 10
        console.log('===========并发数为' + bfNumber + '，进入并发查询=======')
        async.mapLimit(urls, bfNumber, function (url, callback) {
            getUrlList(url, callback);
        }, function (err, result) {
            // res.send(result);
            console.log(result);
            bingfa();
        });
    }

}


/**
 * 去除数组中的重复项
 * @param arr
 * @returns {Array}
 */
var uniqueArr = function (arr) {
    var result = [], hash = {}, target_temp = [];
    var reg = /^\/\w.+\/+(index\d+|\d+)\./;//正则取出商品链接或者翻页链接,以/开头，结尾是index+数字或者数字再加点
    var regLarge = /^\/\w.+/; //所有开头是斜杠的url
    var target = /^\/\w.+index\d+\./;
    for (var i = 0, elem; (elem = arr[i]) != null; i++) {
        if (!hash[elem] && reg.exec(elem)) {
            if (!in_array(elem, allUrl)) {
                allUrl.push(prefix + elem);
                result.push(prefix + elem);
                if (target.exec(elem)) {
                    if (!in_array(elem, targetUrl)) {
                        targetUrl.push(prefix + elem);
                        target_temp.push(prefix + elem);

                    }
                } else {
                    uncrawledUrl.push(prefix + elem);
                }

                hash[elem] = true;
            }

        }
    }
    //目标插入数据库
    baseModel.insertUnique('target_url', target_temp);

    return result;
}


/*每隔300毫秒模拟发送ajax请求，并获取请求结果中所有的图片链接*/
var getIAjaxUrlList = function (offset) {
    request.post("https://www.zhihu.com/node/QuestionAnswerListV2")
        .set(config)
        .send("method=next&params=%7B%22url_token%22%3A34937418%2C%22pagesize%22%3A20%2C%22offset%22%3A" + offset + "%7D&_xsrf=98360a2df02783902146dee374772e51")
        .end(function (err, res) {
            if (err) {
                console.log(err);
            } else {
                var response = JSON.parse(res.text);
                /*想用json的话对json序列化即可，提交json的话需要对json进行反序列化*/
                if (response.msg && response.msg.length) {
                    var $ = cheerio.load(response.msg.join(""));
                    /*把所有的数组元素拼接在一起，以空白符分隔*/
                    var answerList = $(".zm-item-answer");
                    answerList.map(function (i, answer) {
                        var images = $(answer).find('.zm-item-rich-text img');
                        images.map(function (i, image) {
                            photos.push($(image).attr("src"));
                        });
                    });
                    setTimeout(function () {
                        offset += 20;
                        console.log("已成功抓取" + photos.length + "张图片的链接");
                        getIAjaxUrlList(offset);
                    }, 300);
                } else {
                    console.log("图片链接全部获取完毕，一共有" + photos.length + "条图片链接");
                    // console.log(photos);
                    return downloadImg(50);
                }
            }
        });
}

var requestAndwrite = function (url, callback) {
    request.get(url).end(function (err, res) {
        if (err) {
            console.log(err);
            console.log("有一张图片请求失败啦...");
        } else {
            var fileName = path.basename(url);
            fs.writeFile("./img/" + fileName, res.body, function (err) {
                if (err) {
                    console.log(err);
                    console.log("有一张图片写入失败啦...");
                } else {
                    callback(null, "successful !");
                    /*callback貌似必须调用，第二个参数为下一个回调函数的result参数*/
                }
            });
        }
    });
}

var downloadImg = function (asyncNum) {
    /*有一些图片链接地址不完整没有“http:”头部,帮它们拼接完整*/
    for (var i = 0; i < photos.length; i++) {
        if (photos[i].indexOf("http") === -1) {
            photos[i] = "http:" + photos[i];
        }
    }
    console.log("即将异步并发下载图片，当前并发数为:" + asyncNum);
    async.mapLimit(photos, asyncNum, function (photo, callback) {
        console.log("已有" + asyncNum + "张图片进入下载队列");
        requestAndwrite(photo, callback);
    }, function (err, result) {
        if (err) {
            console.log(err);
        } else {
            console.log(result);
        }
    });

};

getInitUrlList();

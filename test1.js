/**
 * Created by qingz on 2016/4/19.
 */
var request = require("superagent");
var cheerio = require("cheerio");
var async = require("async");
var path = require("path");
var fs = require("fs");
prefix = 'http://detail.zol.com.cn';
allUrl = [];//所有url
crawledUrl = [];//已爬取url
uncrawledUrl = [];//待爬取url
targetUrl = [];//目标商品页面
var BaseModel = require('./base_model')
    , baseModel = new BaseModel()
    , rowInfo = {}
    , tableName = 'url';
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

/*获取首屏所有URL链接*/
var getInitUrlList = function () {
    var urlArray = [];
    /*存储所有链接的数组*/

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
                urlArray = uniqueArrIndex(urlArray)

                console.log("已成功抓取" + urlArray.length + "个种子URL");
                // console.dir(urlArray);

                //插入数据库
                if (urlArray.length) {
                    baseModel.insertUnique(tableName, urlArray);

                }

            }
        });
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
        if (!hash[elem] && regLarge.exec(elem)) {
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


/**
 * 从未爬取队列中获取要爬取的url，并把url放入已爬取队列
 * @returns {Array}
 */
var getUrls = function () {
    var urls = [];
    var temp;
    for (var i = 0; i < 30; i++) {
        if (uncrawledUrl.length) {
            temp = uncrawledUrl.shift();
            urls.push(temp);
            crawledUrl.push(temp);
        }
    }
    return urls;
}

/**
 * 控制并发
 */
var bingfa = function () {

    var urls = getUrls();
    console.log('urls number:' + urls.length + ', uncrawledUrl number: ' + uncrawledUrl.length + ', allUrl number: ' + allUrl.length + ',target number:' + targetUrl.length + ',crawledUrl:' + crawledUrl.length);
    if (urls.length != 0) {
        // 并发量控制为 5
        console.log("===========并发数为5，进入并发查询=======")
        async.mapLimit(urls, 5, function (url, callback) {
            getUrlList(url, callback);
        }, function (err, result) {
            // res.send(result);
            console.log(result);
            bingfa();
        });
    }

}


/**
 * 获取每个url的里面的url
 * @param url
 */
var getUrlList = function (url, callback) {
    var urlArray = [];
    /*存储所有链接的数组*/
    request.get(url)
        .end(function (err, res) {
            if (err) {
                console.log(err);
            } else {
                var $ = cheerio.load(res.text);

                $("a").each(function () {
                    urlArray.push($(this).attr("href"));
                });
                urlArray = uniqueArr(urlArray);
                callback(null, "成功抓取" + urlArray.length + "个需要URL      " + url);
                //插入数据库
                if (urlArray.length) {
                    baseModel.insertUnique(tableName, urlArray);

                }

            }
        });
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

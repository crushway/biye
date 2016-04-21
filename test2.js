/**
 * Created by qingz on 2016/4/21.
 */
var async = require('async');
var superagent = require('superagent');
var cheerio = require('cheerio');
var url = require('url');
var cnodeUrl = 'http://www.daliane.com/?order=views';

// 并发连接数的计数器
var concurrencyCount = 0;
var fetchUrl = function (url, callback) {
    // delay 的值在 2000 以内，是个随机的整数
    var delay = parseInt((Math.random() * 10000000) % 2000, 10);
    concurrencyCount++;
    console.log('现在的并发数是', concurrencyCount, '，正在抓取的是', url, '，耗时' + delay + '毫秒');
    setTimeout(function () {
        concurrencyCount--;
        callback(null, url + ' html content');
    }, delay);
};
superagent.get(cnodeUrl)
    .end(function (err, res) {
        if (err) {
            return console.error(err);
        }
        var topicUrls = [];
        var $ = cheerio.load(res.text);
        $('section.content h1.entry-title a').each(function (idx, element) {
            var $element = $(element);
            topicUrls.push($element.attr('href'));
        });
        async.mapLimit(topicUrls, 2, function (url, callback) {
            fetchUrl(url, callback);
        }, function (err, result) {
            console.log('final:');
            console.log(result);
        });
    });
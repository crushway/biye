/**
 * Created by qing on 16-3-21.
 */

var http = require('http');
var url = 'http://detail.zol.com.cn/notebook_index/subcate16_list_1.html';//ZOL报价首页 > 笔记本电脑
var cheerio = require('cheerio');
var url_prefix = "http://detail.zol.com.cn";
var iconv = require('iconv-lite');
var indexUrlQueue = [];
var indexNameQueue = [];

var rowInfo = {}
var BaseModel = require('./base_model')
    , baseModel = new BaseModel()
    , rowInfo = {}
    , tableName = 'side_enter';
rowInfo.side_name = "";


http.get(url, function (res) {
    var html = '';
    res.setEncoding('binary');
    res.on('data', function (data) {
        html += data;
    })
    res.on('end', function () {
        //var buf = new Buffer(html, 'binary');
        //var html = iconv.decode(buf, 'GBK');
        //console.log(str);
        //html = iconv.decode(html, 'gbk');
        crawlerIndex(html);
    })
}).on('error', function () {
    console.log('爬取页面错误');
});

/**
 *
 * 爬取队列里的url
 * */
function  cralwUrl(){
while (indexUrlQueue.length > 0) {
    var indexUrl = indexUrlQueue.shift();
    console.log("jinlai"+indexUrl);
    http.get(indexUrl, function (res) {
        var html = '';
        res.setEncoding('binary');
        res.on('data', function (data) {
            html += data;
        })
        res.on('end', function () {

            crawlerProduct(html, indexUrl);
        })
    }).on('error', function () {
        console.log('爬取页面错误');
    });
}
}
/**
 * 爬不同类型的信息
 * @param html
 */

function crawlerProduct(html, indexUrl) {
    var $ = cheerio.load(html);


    rowInfo.side_url = indexUrl;
    console.log("当前页面"+$.location.href);

    rowInfo.side_name = $('.active em').text();
    var buf = new Buffer(rowInfo.side_name, 'binary');
    rowInfo.side_name = iconv.decode(buf, 'GBK');
    console.log( rowInfo.side_name);
    rowInfo.total_number = $('.total b').text();
    var pageRow = $('.small-page-active').text().split("/", 2);
    rowInfo.page = pageRow[1];
    /*console.log(totalNumber);
     console.log(page);*/
    //插入数据库
  /*  baseModel.insert(tableName, rowInfo, function (ret) {
        console.log(ret);
    });*/
   
};

/**
 * 爬初始页面，手机或者电脑才需要
 * @param html
 */

function crawlerIndex(html) {
    var $ = cheerio.load(html);
    $(".sort a").each(function (i, e) {
        rowInfo.side_url = $(e).attr("href");
        rowInfo.side_url = url_prefix + rowInfo.side_url;//拼接完整url
        // console.log(rowInfo.side_url);
        indexUrlQueue.push(rowInfo.side_url);
        var item = $(e).text().trim();
        var buf = new Buffer(item, 'binary');
        rowInfo.side_name = iconv.decode(buf, 'GBK');
        indexNameQueue.push(rowInfo.side_name);
    });
    cralwUrl();

};



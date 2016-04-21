/**
 * Created by qing on 16-3-20.
 */

var http = require('http');
var url = 'http://detail.zol.com.cn/subcategory.html';//ZOL报价首页 > 全部分类
var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var rowInfo = {};
var count=1;
var BaseModel = require('./base_model')
 , baseModel = new BaseModel()
 , rowInfo = {}
 , tableName = 'main_enter';
 rowInfo.main_name = '中关村全部产品分类';
 rowInfo.main_url = 'http://detail.zol.com.cn/subcategory.html';
 rowInfo.main_status = 1;

 //插入数据库
/* baseModel.insert(tableName, rowInfo, function(ret){
 rowInfo.main_status = 0;
 console.log(ret);
 });*/
http.get(url, function(res){
    var html = '';
    res.setEncoding('binary');
    res.on('data', function(data){
        html += data;
    });
    res.on('end',function(){
        //var buf = new Buffer(html, 'binary');
        //var html = iconv.decode(buf, 'GBK');
        //console.log(str);
        //html = iconv.decode(html, 'gbk');
        crawlerProduct(html);
    });
}).on('error', function(){
    console.log('爬取页面错误');
});

function crawlerProduct(html) {
    var $ = cheerio.load(html);
    var totalNumber = $('.small-page-active');
    var chapters = $('.public-category-nav');


    //var data = [];
    //var link = $('.category-items').find('h3');
    $(".subcate-list  a").each(function(i, e) {
        rowInfo.main_url='http://detail.zol.com.cn'+$(e).attr("href");
        var itme=$(e).text().trim();
        var buf = new Buffer(itme, 'binary');
        rowInfo.main_name = iconv.decode(buf, 'GBK');
        console.log(count);
        console.log(rowInfo.main_url+'----'+rowInfo.main_name);
        count++;
        //插入数据库
       /* baseModel.insert(tableName, rowInfo, function(ret){
         console.log(ret);
         });
*/
    });

    return 0;
};


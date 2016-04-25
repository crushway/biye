/**
 * Created by qing on 16-3-20.
 */
var http = require('http');
var url = 'http://detail.zol.com.cn/server/index388856.shtml';
var url = 'http://detail.zol.com.cn/digital_camcorder/index378339.shtml';
// var url = 'http://detail.zol.com.cn/digital_storage/index48067.shtml';
// var url = 'http://detail.zol.com.cn/e-cigarettes/index607776.shtml';
 var url = 'http://detail.zol.com.cn/HIFI_Mobilephone/index405911.shtml';
 // var url = 'http://detail.zol.com.cn/tablepc/index321392.shtml';
 // var url = 'http://detail.zol.com.cn/Outdoorcushion/index512720.shtml';
var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var async = require("async");
var options = {
    hostname: url,
    port: 80,
    path: '/upload',
    method: 'POST'
};

var BaseModel = require('./base_model')
    , baseModel = new BaseModel()
http.get(url, function (res) {
    var html = '';
    res.setEncoding('binary');
    res.on('data', function (data) {
        html += data;
    })
    res.on('end', function () {
        crawlerProduct(url,html);
    })
}).on('error', function () {
    console.log('爬取页面错误');
});

function crawlerProduct(url,html) {
    var info={};
   /* var reg=/\/\w+\//;//取出url商品类目
    var subcate=reg.exec(url);*/
    var $ = cheerio.load(html);
    // console.dir($("div.breadcrumb a"));
    var something = $("div.breadcrumb a");
    async.series(
        [
            function (cb) {
                //类别
                var product_category = $(something[1]).text().trim();
                var buf = new Buffer(product_category, 'binary');
                product_category = iconv.decode(buf, 'GBK');
                cb(null,product_category);
            },
            function (cb) {
                //品牌
                var product_brand = $(something[2]).text().trim();

                var buf = new Buffer(product_brand, 'binary');
                product_brand = iconv.decode(buf, 'GBK');
                cb(null,product_brand);

            },
            function (cb) {
                //商品名称
                if(something.length==4){
                    var product_name = $(".breadcrumb h1").text().trim();
                    var buf = new Buffer(product_name, 'binary');
                    product_name = iconv.decode(buf, 'GBK');
                }else{
                    var product_name = $(".page-title h1").text().trim();
                    var buf = new Buffer(product_name, 'binary');
                    product_name = iconv.decode(buf, 'GBK');
                }
                if(!product_name){
                    var product_name = $(".product-name").text().trim();
                    var buf = new Buffer(product_name, 'binary');
                    product_name = iconv.decode(buf, 'GBK');
                }
                if(!product_name){
                    var product_name = $(".breadcrumb span").text().trim();
                    var buf = new Buffer(product_name, 'binary');
                    product_name = iconv.decode(buf, 'GBK');
                }
                cb(null,product_name);
            },
            function (cb) {
                //商品描述
                var product_desc = $(".subtitle").text().trim();
                if (product_desc) {
                    var buf = new Buffer(product_desc, 'binary');
                    product_desc = iconv.decode(buf, 'GBK');
                    cb(null,product_desc);
                }else{
                    cb(null,'无');
                }


            },

            function (cb) {
                //价格
                var product_price = $(".price-sign").next().text().trim();
                if (product_price) {

                } else {
                    var product_price = $(".price-type").text().trim();
                }
                var buf = new Buffer(product_price, 'binary');
                product_price = iconv.decode(buf, 'GBK');
                cb(null,product_price);

            }
        ],function (err,values) {
            info.product_category=values[0];
            info.product_brand=values[1];
            info.product_name=values[2];
            info.product_desc=values[3];
            info.product_price=values[4];
            info.product_url=url;

            console.dir(info);
        }
    )
   /* //商品名称
    if(something.length==4){
        var product_name = $(".breadcrumb h1").text().trim();
        info.product_name =product_name;

    }else{
        var product_name = $(".page-title h1").text().trim();
        info.product_name = product_name;

    }


    //商品描述
    var product_desc = $(".subtitle").text().trim();
    if(product_desc){
        info.product_desc = product_desc;

    }
    //价格
    var product_price = $(".price-sign").next().text().trim();
    if(product_price){

    }else{
         product_price = $(".price-type").text().trim();
    }
    info.product_price = product_price;

    var buf = new Buffer(info, 'binary');
    info= iconv.decode(buf, 'GBK');
    //url
    info.product_url=url;
    // baseModel.insertProduct('product',info);
    console.dir(info);*/

};


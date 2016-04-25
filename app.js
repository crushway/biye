/**
 * Created by qing on 16-3-20.
 */
var http = require('http');
var url = 'http://detail.zol.com.cn/server/index388856.shtml';
var url = 'http://detail.zol.com.cn/digital_camcorder/index378339.shtml';
// var url = 'http://detail.zol.com.cn/digital_storage/index48067.shtml';
// var url = 'http://detail.zol.com.cn/e-cigarettes/index607776.shtml';
var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var BaseModel = require('./base_model')
    , baseModel = new BaseModel()
http.get(url, function (res) {
    var html = '';
    res.setEncoding('binary');
    res.on('data', function (data) {
        html += data;
    })
    res.on('end', function () {
        crawlerProduct(html);
    })
}).on('error', function () {
    console.log('爬取页面错误');
});

function crawlerProduct(html) {
    var info={};
    var $ = cheerio.load(html);
    var something = $("div.breadcrumb a");
    //类别
    var product_category = $(something[1]).text().trim();
    var buf = new Buffer(product_category, 'binary');
    info.product_category = iconv.decode(buf, 'GBK');
    console.log(info.product_category);
    //品牌
    var product_brand = $(something[2]).text().trim();

    var buf = new Buffer(product_brand, 'binary');
    info.product_brand = iconv.decode(buf, 'GBK');
    console.log(info.product_brand);

    //商品名称
    var product_name = $(".page-title h1").text().trim();
    var buf = new Buffer(product_name, 'binary');
    info.product_name = iconv.decode(buf, 'GBK');
    console.log(info.product_name);

    //商品描述
    var product_desc = $(".subtitle").text().trim();
    if(product_desc){
        var buf = new Buffer(product_desc, 'binary');
        info.product_desc = iconv.decode(buf, 'GBK');
        console.log(info.product_desc);
    }
    //价格
    var product_price = $(".price-sign").next().text().trim();
    if(product_price){

    }else{
        var product_price = $(".price-type").text().trim();
    }
    var buf = new Buffer(product_price, 'binary');
    info.product_price = iconv.decode(buf, 'GBK');
    console.log(info.product_price);

    //url
    info.product_url=url;
    baseModel.insertProduct('product',info);
    console.dir(info);

};


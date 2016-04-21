/**
 * Created by qing on 16-3-20.
 */
var http = require('http');
var url = 'http://detail.zol.com.cn/cell_phone_index/subcate57_0_list_1_0_1_2_0_1.html';
var url = 'http://detail.zol.com.cn/notebook_index/subcate16_list_1.html';
var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var rowInfo = {}
/*var BaseModel = require('./base_model')
    , baseModel = new BaseModel()
    , rowInfo = {}
    , tableName = 'main_enter';
rowInfo.main_name = '中关村报价首页';
rowInfo.main_url = 'http://detail.zol.com.cn/';
rowInfo.main_status = 1;

//插入数据库
baseModel.insert(tableName, rowInfo, function(ret){
    rowInfo.main_status = 0;
    console.log(ret);
});*/
http.get(url, function(res){
    var html = '';
    res.setEncoding('binary');
    res.on('data', function(data){
        html += data;
    })
    res.on('end',function(){
        //var buf = new Buffer(html, 'binary');
        //var html = iconv.decode(buf, 'GBK');
        //console.log(str);
        //html = iconv.decode(html, 'gbk');
        crawlerProduct(html);
    })
}).on('error', function(){
    console.log('爬取页面错误');
});

function crawlerProduct(html) {
    var $ = cheerio.load(html);
    var totalNumber = $('.small-page-active');
    var table=$(".clearfix li");
    var rl= table.rows.length;
    for (var i=0;i<rl;i++) {
        var picsmall=t.rows[i].cells[0].getElementsByTagName("img")[0].getAttribute('src');
        var picbig=t.rows[i].cells[1].getElementsByTagName("img")[0].getAttribute('src');
        var tit=t.rows[i].cells[2].innerHTML;
        var txt=t.rows[i].cells[3].innerHTML;
    }

    //var data = [];
    //var link = $('.category-items').find('h3');
    $(".clearfix li").each(function(i, e) {
        var $element=$(e);
        console.dir($element);
        /*rowInfo.price=$element(price-type).text();

        var product_name=$(e h3 a ).attr("title");
        var buf = new Buffer(product_name, 'binary');
        rowInfo.product_name = iconv.decode(buf, 'GBK');
        console.log(objInfo);
       /!* console.log( rowInfo.product_name);
        console.log( rowInfo.price);*!/
        console.log( "---------");*/


        //插入数据库
        /*baseModel.insert(tableName, rowInfo, function(ret){
            console.log(ret);
        });*/

    });


};


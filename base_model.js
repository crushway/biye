/**
 * @type class BaseModel
 * @author qing
 * @time 2016-03-20
 * @desc desc base_model.js
 */
var Util = require('./util')
    , mysql = require('mysql')
    , dbClient;

module.exports = function () {
    __constructor();
    /**
     *
     * 根据主键id值查询数据库的一条记录
     * @param tableName string
     * @param idJson id
     * @param callback function
     * @return null
     */
    this.findOneById = function (tableName, idJson, callback) {
        dbClient.query('SELECT * FROM ' + tableName + ' where ?', idJson,
            function (error, results) {
                if (error) {
                    console.log('GetData Error: ' + error.message);
                    dbClient.end();
                    callback(false);
                } else {
                    if (results) { //如果查询到数据则返回一条数据即可
                        callback(results.pop());
                    } else { //查询数据为空则返回空数据
                        callback(results);
                    }
                }
            });
    };

    /**
     * 普通查询语句
     * @param sqlStr
     * @param callback
     */
    this.query = function (sqlStr, callback) {
        dbClient.query(sqlStr,
            function (error, results) {
                if (error) {
                    console.log('GetData Error: ' + error.message);
                    dbClient.end();
                    callback(false);
                } else {
                    if (results) { //如果查询到数据则返回一条数据即可
                        callback(results);
                    } else { //查询数据为空则返回空数据
                        callback(results);
                    }
                }
            });
    };
    /**
     *
     * @desc 向数据库插入数据
     * @param tableName string
     * @param rowInfo json
     * @param callback function
     * @return null
     */
    this.insert = function (tableName, rowInfo, callback) {
        dbClient.query('INSERT INTO ' + tableName + ' SET ?', rowInfo, function (err, result) {
            if (err) throw err;
            // callback(result.insertId);
        });
    };


    /**
     * 插入数据时检查是否重复
     */
    this.insertUnique = function (tableName, urlArray) {
        if(urlArray.length==0){
            return;
        }
        //从线程池中获得一个连接
        dbClient.getConnection(function(err, conn){

            if (err) {
                console.log(err);
            }
            var insertNumber=[];
            for (var i = 0; i < urlArray.length; i++) {
                insertNumber.push('(\''+urlArray[i]+'\')');
            }
            conn.query('INSERT INTO ' + tableName + '(url_name) values'+insertNumber.join(), function (err, result) {
                if (err) throw err;
                console.dir(result.message);
                conn.release();
            });

           /* //使用async保证全部插入完成后再commit transaction
            async.parallel([
                storeStudent(student.baseInfo, "base_info"),
                storeStudent(student.studyHistory, "study_history", ["begin", "end", "school", "student_no"]),
                storeStudent(student.classHistory, "class_history", ["class_name", "score", "school_year", "student_no"]),
                storeStudent(student.family, "family", ["name", "relation", "work", "cell", "student_no"]),
                storeStudent(student.awards, "awards", ["award_name", "money", "student_no"]),
                function(){
                    //释放线程
                    conn.release();
                    callback({
                        "error": false,
                        "message": "student " + stuNo + " stored!",
                        "stuNo": stuNo
                    });
                    return true;
                }
            ]);//async任务结束*/
           /* for (var i = 0; i < urlArray.length; i++) {
                var urlName = urlArray[i];
                var sql = 'select * from ' + tableName + " where url_name='" + urlName + "'";
                conn.query(sql,
                    function (urlName,error, results) {
                            if (results.length!=0) { //如果查询到数据则不操作
                                console.log("==========已经有数据！！！==========="+results.length);
                                return;
                            } else { //查询数据为空则插入数据
                                console.log("==========需要插入数据！！！==========="+urlName)
                                var rowInfo = {};
                                rowInfo.url_name = urlName;
                                conn.query('INSERT INTO ' + tableName + ' SET ?', rowInfo, function (err, result) {
                                    if (err) throw err;
                                    console.dir(result);
                                    conn.release();
                                });
                            
                        }
                    }.bind(this,urlName));
            }*/
            
          
        });
       

    };

    /**
     * 检查数据存在
     * @param stuNo
     * @param callback
     */
    function urlExists(table,url, callback){

        dbClient.getConnection(function(err, conn){

            conn.query('select * from ' + table + " where url_name='" + url + "'", function(err, result){
                if (err) {
                    console.log(err.message);
                }

                conn.release();
                if (result.length) {
                    callback(true);
                    return true;
                }
                else{
                    callback(false);
                    return false;
                }
            });
        });
    }

    /**
     *
     * @desc 修改数据库的一条数据
     * @param tableName string
     * @param idJson json
     * @param callback function
     * @return null
     */
    this.modify = function (tableName, idJson, rowInfo, callback) {
        dbClient.query('update ' + tableName + ' SET ? where ?', [rowInfo, idJson], function (err, result) {
            if (err) {
                console.log("ClientReady Error: " + err.message);
                callback(false);
            } else {
                callback(result);
            }
        });
    };

    /**
     *
     * @desc 删除数据库的一条数据
     * @param tableName string
     * @param idJson json
     * @param rowInfo json
     * @param callback function
     * @return null
     */
    this.remove = function (tableName, idJson, callback) {
        dbClient.query('delete from ' + tableName + ' where ?', idJson,
            function (error, results) {
                if (error) {
                    console.log("ClientReady Error: " + error.message);
                    dbClient.end();
                    callback(false);
                } else {
                    callback(true);
                }
            });
    };

    /**
     *
     * @desc 条件查询数据
     * @param tableName string
     * @param whereJson json desc(and和or区别，其中的条件为key值、连接符大于小于还是等于、value值)
     * @param orderByJson json desc({'key' : 'time', 'type':'desc'})
     * @param limitArr array desc（第一个元素是返回偏移量，第二个是返回数量，空返回全部）
     * @param fieldsArr array desc（返回哪些字段）
     * @param callback function
     * @return null
     */
    this.find = function (tableName, whereJson, orderByJson, limitArr, fieldsArr, callback) {
        var andWhere = whereJson['and']
        //, orWhere    = whereJson['or']
            , andArr = []
            , orArr = [];
        /* 将数组转换为where and条件array */
        for (var i = 0; i < andWhere.length; i++) {
            andArr.push(andWhere[i]['key'] + andWhere[i]['opts'] + andWhere[i]['value']);
        }
        /* 将数组转换为where or条件array */
        //for(var i=0; i<orWhere.length; i++){
        //	orArr.push(orWhere[i]['key'] + orWhere[i]['opts'] +orWhere[i]['value']);
        //}
        /* 判断条件是否存在，如果存在则转换相应的添加语句 */
        var filedsStr = fieldsArr.length > 0 ? fieldsArr.join(',') : '*'
            , andStr = andArr.length > 0 ? andArr.join(' and ') : ''
            , orStr = orArr.length > 0 ? ' or ' + orArr.join(' or ') : ''
            , limitStr = limitArr.length > 0 ? ' limit ' + limitArr.join(',') : ''
            , orderStr = orderByJson ? ' order by ' + orderByJson['key'] + ' ' + orderByJson['type'] : '';
        /* 执行mysql语句 */
        dbClient.query('SELECT ' + filedsStr + ' FROM ' + tableName + ' where ' + andStr + orStr + orderStr + limitStr,
            function (error, results) {
                if (error) {
                    console.log('GetData Error: ' + error.message);
                    dbClient.end();
                    callback(false);
                } else {
                    callback(results);
                }
            });
    };

    /**
     *
     * 数据库连接构造函数
     */
    function __constructor() {
        /*var dbConfig = Util.get('config.json', 'db');
         /!* 获取mysql配置信息 *!/
         client = {};
         client.host = dbConfig['host'];
         client.port = dbConfig['port'];
         client.user = dbConfig['user'];
         client.password = dbConfig['password'];
         dbClient = mysql.createConnection(client);
         dbClient.connect();
         /!* 执行mysql指令，连接mysql服务器的一个数据库 *!/
         dbClient.query('USE ' + dbConfig['dbName'], function (error, results) {
         if (error) {
         console.log('ClientConnectionReady Error: ' + error.message);
         dbClient.end();
         }
         console.log('connection local mysql success');
         });*/

        dbClient = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: 'qz6124003',
            database: 'zhongguancun',
            connectionLimit: 15
        });
    }
}
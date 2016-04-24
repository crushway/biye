CREATE TABLE IF NOT EXISTS `main_enter` (
  `main_id` int(11) not null auto_increment,
  `main_name` varchar(100) COLLATE utf8_bin NOT NULL,
  `main_url` varchar(100) COLLATE utf8_bin NOT NULL,
  `main_status` tinyint(1) default 0 not null,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`main_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1 ;

CREATE TABLE IF NOT EXISTS `side_enter`(
  `side_id` int(11) not null auto_increment,
  `side_name` varchar(100) COLLATE utf8_bin NOT NULL,
  `side_url` varchar(100) COLLATE utf8_bin NOT NULL,
  `side_status` tinyint(1) default 0 not null,
  `father_id` int(11) default 0 not null,
  `total_number` int(11) default 0 not null,
  `page` int(11) default 0 not null,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`side_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `product`(
  `product_id` int(11) not null auto_increment,
  `product_name` varchar(100) COLLATE utf8_bin NOT NULL,
  `product_url` varchar(100) COLLATE utf8_bin NOT NULL,
  `product_price` int(11) default 0 not null,
  `product_desc`  varchar(100) default null,
  `father_id` int(11) default 0 not null,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1 ;

CREATE TABLE IF NOT EXISTS `urls`(
  `url_id` int(11) not null auto_increment,
  `url_name` varchar(100) COLLATE utf8_bin NOT NULL,
  `is_crawled` tinyint(1) not null default 0,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`url_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1 ;



CREATE TABLE IF NOT EXISTS `targetUrl`(
  `url_id` int(11) not null auto_increment,
  `url_name` varchar(100) COLLATE utf8_bin NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`url_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1 ;
CREATE TABLE IF NOT EXISTS `allCrawledUrl`(
  `url_id` int(11) not null auto_increment,
  `url_name` varchar(100) COLLATE utf8_bin NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`url_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1 ;
CREATE TABLE IF NOT EXISTS `crawledUrl`(
  `url_id` int(11) not null auto_increment,
  `url_name` varchar(100) COLLATE utf8_bin NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`url_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_bin AUTO_INCREMENT=1 ;
'use strict';

var Log4js = require('log4js');
var cheerio = require('cheerio');
var request = require('request');
var cssLint = require('csslint')

class css {

    constructor(options) {
		if (!options) {
			options = {
				css: {
					limit: 1024
				},
			    logging : {
					appenders: {
						out:{ type: "console" }
					},
					categories: {
						default: { 
							appenders: ["out"], 
							level: "error" 
						}
					}
				}
			}
		}
        this.options = options;
        // this.options.logging.categories.css = this.options.logging.categories.default;
        // this.options.logging.categories.default = undefined;
        Log4js.configure(this.options.logging);	
		this.logger = Log4js.getLogger();
    }

	checkCSS (css) {
		var result = cssLint.CSSLint.verify(css + '{}');
		var errorCode = 0;
		for (let i = 0;i < result.messages.length;i++) {
			if (result.messages[i].type == 'error') {
                //TODO assign codes to messages
				errorCode += 1;
			}
		};
		return {
			'errorCode' : errorCode,
			'messages': result.messages
		};
	}

	cssQuery (url, css) {
		var self = this;
		this.logger.debug("CSS: " + css);
		return new Promise(function(resolve, reject) {
			request(url, function (error, response, body) {
				if (error) {
					self.logger.error(error);
				}
				//TODO support probably most redirects
				if ((response.statusCode < 200) || (response.statusCode >= 300)) {
					reject('HTTP status code of response is not 200');
				}
				var $ = cheerio.load(body);
				//TODO input checking
				var text = "";
				try {
					text = $(css).text();
				} catch(e) {
					reject(e);
				}
				if (text.length > self.options.css.limit) {
					text = text.substring(0, 1024);
				}
				self.logger.info('CSS found: >' + text + '<');
				resolve(text);
			});
		});
    }
    
    async handleQuery(parameter) {
		var cssPos = parameter.indexOf("///");
		if (cssPos < 0) {
			throw new Error('CSS after /// not found in query');
		}
		var url = parameter.substring(0, cssPos);
		this.logger.debug("URL: " + url);
		var css = parameter.substring(cssPos+3, parameter.length);
		var flags = this.checkCSS(css).errorCode;
		var text = "";
		try {
			text = await this.cssQuery(url, css);
		} catch(e) {
			flags = 1000 | flags;
		}
        return {
			answer: text,
			flags: flags
		};
    }
}

module.exports = css;
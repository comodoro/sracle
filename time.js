'use strict';
var Log4js = require('log4js');
var request = require('request');


class Time {

    constructor(options) {
		if (!options) {
			options = {
				modules: {
					time: {
						options: {
							source: 'native'
						}
					},
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
        Log4js.configure(this.options.logging);	
		this.logger = Log4js.getLogger();
    }

    async handleQuery(parameter) {
        var time = Date.now();
        return {
			answer: time,
			flags: 0
		};
    }
}

module.exports = Time;
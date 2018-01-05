'use strict';

var Log4js = require('log4js');
const fetch = require('node-fetch');

class RandomModule {

    constructor(options) {
        
        this.MAX_RANGE = 65535;
        this.MAX_HOW_MANY = 1024;
		if (!options) {
			options = {
				rnd: {
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

    async getRandomNumbers(url, range) {
        const response = await fetch(url);
        const json = await response.json();
        var data = json.data;
        for (let i = 0;i < data.length;i++) {
            //TODO additionally seed or scramble
            data[i] = Math.floor((data[i] / 65535 * range) + 1);
        }
        return data;
    }

    async handleQuery(parameter) {
        var range = 0;
        var flags = 0;
        var rangeStr;
        var howMany = 1;
		var rangePos = parameter.indexOf("///");
		if (rangePos < 0) {
            rangeStr = parameter;
        } else {
            rangeStr = parameter.substring(0, rangePos);
            try {
                howMany = Number(parameter.substring(rangePos+3, parameter.length));
            } catch(err) {
                flags += 1;
            }
        }
        try {
            range = Number(rangeStr);
        } catch(err) {
            flags = +1;
        }
        if  (isNaN(range)) {
            range = 1;
            flags += 1;
        }
        if  (isNaN(howMany)) {
            howMany = 1;
            flags += 1;
        }
        if (range <= 0) range = 1;
        if (range > this.MAX_RANGE) range = this.MAX_RANGE;
        if (howMany <= 0) howMany = 1;
        if (howMany > this.MAX_HOW_MANY) howMany = this.MAX_HOW_MANY;

        var url = `https://qrng.anu.edu.au/API/jsonI.php?length=${howMany}&type=uint16`;
        this.logger.debug("URL: " + url);
        var numbers = "";
		try {
			numbers = await this.getRandomNumbers(url, range);
		} catch(e) {
			flags = 1000 | flags;
        }
        var answer = numbers.join();
        return {
			answer: answer,
			flags: flags
		};
    }
}

module.exports = RandomModule;
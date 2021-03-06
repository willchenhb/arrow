/*jslint forin:true sub:true anon:true, sloppy:true, stupid:true nomen:true, node:true continue:true*/

/*
* Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

var util = require("util");
var log4js = require("log4js");
var Controller = require("../interface/controller");

function LocatorController(testConfig, testParams, driver) {
    Controller.call(this, testConfig, testParams, driver);

    this.logger = log4js.getLogger("LocatorController");
}

util.inherits(LocatorController, Controller);

LocatorController.prototype.execute = function (callback) {
    var self = this,
        config = this.testConfig,
        params = this.testParams,
        logger = this.logger,
        webdriver,
        locator,
        strategy,
        target,
        stay,
        waitForElement,
        elem,
        done;

    try {

        webdriver = self.driver.getWebDriver();

        done = function() {
            logger.info("done");
            callback();
        };

        if (!webdriver) {
            callback("Locator controller is only supported for the selenium driver");
            return;
        }

        target = params["value"];
        if (!target) {
            callback("\"value\" parameter is required");
            return;
        }

        strategy = params["using"];

        if (!strategy) {
            strategy = "css";
        }
        /**
         * @param: stay
         * @purpose: passed, override default behavior of click requiring new page load
         *   (for in-page interactions)
         * @example: click on an element, to open a menu
         *
         * @usage:
                 {
                    "controller": "locator",
                    "params": {
                        "value": ".yom-menu-switch",
                        "click" : true,
                        "stay" : true
                    }
                }
         */
        stay = params["stay"];
        if (!stay) {
            stay = false;
        }

        /**
         * @param: waitForElement
         * @purpose: if passed, waits for the element to appear on page, and the only executes test.
         * @example: wait for
         *
         * @usage:
         {
            "controller": "locator",
            "params": {
                "value": "#btnQuotes",
                "click" : true,
                "waitForElement" : ".yfi_rt_quote_summary"
            }
        }
         */

        waitForElement = params["waitForElement"];

        locator = webdriver.By[strategy](target);
        function findAndAct() {
            elem = webdriver.findElement(locator);
            logger.info("Finding element: By " + strategy + " (" + target + ")");
            if (true === params["click"]) {
                if (stay) {
                    elem.click().then(done);
                } else if (waitForElement) {
                    elem.click();
                    webdriver.waitForElementPresent(webdriver.By.css(waitForElement)).then(done);
                } else {
                    elem.click();
                    webdriver.waitForNextPage().then(done);
                }
            } else {
                var sendKeys = params["text"];
                if (sendKeys) {
                    elem.clear();
                    elem.sendKeys(sendKeys).then(done);
                } else {
                    done();
                }
            }
        }

        if (true === params["wait"]) {
            webdriver.waitForElementPresent(locator).then(findAndAct);
        } else {
            findAndAct();
        }
    } catch (e) {
        self.logger.error(e.toString());
        callback();
    }
};

module.exports = LocatorController;

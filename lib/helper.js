'use strict'

exports.whoAreYou = function(headers) {
  let responseObject = {
    "ipaddress":"",
    "language":"",
    "software":""
  };
  responseObject.ipaddress = headers['x-forwarded-for'].substring(0, headers['x-forwarded-for'].indexOf(","));
  responseObject.language = headers['accept-language'].substring(0, headers['accept-language'].indexOf(","));
  responseObject.software = headers['user-agent'].substring(headers['user-agent'].indexOf("(") + 1, headers['user-agent'].indexOf(")"));
  return responseObject;
};
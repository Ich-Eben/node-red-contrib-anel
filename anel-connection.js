module.exports = function(RED) {
	'use strict'
	var request = require("request");
	
    function anelConnectionNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
		
		node.host = config.host||"192.168.178.70";
		node.port = config.port||80;
		node.interval = config.interval * 1000;
		if (node.interval < 5000) node.interval = 5000;
		node.username = node.credentials ? node.credentials.username||"user7" : "user7";
		node.password = node.credentials ? node.credentials.password||"anel" : "anel";
		
		node.outletNodes = [];
		var timerInterval;
		var lastState = {
			hostname: "",
			ipAddress: "",
			name: "",
			time: "",
			runtime: "",
			type: "",
			firmware: "",
			temperature: "",
			outlets: [],
			ios: [],
			sensors: {
				temperature : "",
				humidity: "",
				brightness: ""
			}
		};
		for (var i=1;i<=8;++i) {
			lastState.outlets.push({
				name: "",
				state: false,
				locked: false
			});
			lastState.ios.push({
				name: "",
				state: false,
				isInput: false
			});
		}
		
		getStatus();
		restartInterval();
		
		function getStatus() {
			var url = node.host;
			if (!url.startsWith("http://")) { url = "http://" + url; }
			url += ":" + node.port;
			url += "/u_res.htm?Stat=";
			url += node.username;
			url += node.password;
			
			doRequest(url);
		}
		
		function doRequest(url) {
			var options = {
				url:  url,
				timeout: 10000
			}
			request(options, function(err, res, body) {
				if(err){
					node.outletNodes.forEach( function(outletNode) {
						outletNode.onStatus("error");
					});
                } else {
					//Parse result
					var data = body.split("<br>");
					var info = data[0].split(";");
					var outlets = [];
					if (data.length > 1) { outlets = data[1].split(";"); }
					var ios = [];
					if (data.length > 2) { ios = data[2].split(";") }
					var sensors = [];
					if (data.length > 3) { sensors = data[3].split(";") }
					
					if (info.length >= 8) {
						lastState.hostname 		= info[0];
						lastState.ipAddress 	= info[1];
						lastState.name 			= info[2];
						lastState.time 			= info[3];
						lastState.runtime 		= info[4];
						lastState.type 			= info[5];
						lastState.firmware 		= info[6];
						lastState.temperature 	= info[7];
					}
					if (outlets.length >= 3*8) {
						for (var i=0;i<8;++i) {
							lastState.outlets[i].name 	= outlets[i*3+0];
							lastState.outlets[i].state 	= outlets[i*3+1] === "1";
							lastState.outlets[i].locked = outlets[i*3+2] === "1";
						}
					}
					if (ios.length >= 3*8) {
						for (var i=0;i<8;++i) {
							lastState.ios[i].name 		= ios[i*3+0];
							lastState.ios[i].state 		= ios[i*3+1] === "1";
							lastState.ios[i].isInput 	= ios[i*3+2] === "1";
						}
					}	
					if (sensors.length >= 4) {
						lastState.sensors.temperature 	= sensors[1];
						lastState.sensors.humidity 		= sensors[2];
						lastState.sensors.brightness 	= sensors[3];
					}
					
					//Send new data to all nodes
					node.outletNodes.forEach( function(outletNode) {
						outletNode.onNewData(lastState);
					});
				}
			});
		}
		
		
		function restartInterval() {
			clearTimeout(timerInterval);
			timerInterval = setInterval(getStatus,node.interval||30000);
		}
		
		node.subscribe = function(outletNode) {
			if (node.outletNodes.indexOf(outletNode) < 0) {
				node.outletNodes.push(outletNode);
			}
		};
		
		node.unsubscribe = function(outletNode) {
			var index = node.outletNodes.indexOf(outletNode);
			if (index >= 0) {
				node.outletNodes.splice(index,1);
			}
		};
		
		node.setOutletOrIo = function(type,num,state) {
			restartInterval();
			
			var url = node.host;
			if (!url.startsWith("http://")) { url = "http://" + url; }
			url += ":" + node.port;
			url += "/u_res.htm?";
			if (type !== "sw") {
				url += "IO_";
			} else {
				url += "Sw_";
			}
			if (state) {
				url += "on=";
			} else {
				url += "off=";
			}
			url += num;
			url += ",";
			url += node.username;
			url += node.password;
			
			doRequest(url);
		};
		
		node.updateState = function() {
			getStatus();
			restartInterval();
		};
		
		node.on('close', function(done) {
			clearTimeout(timerInterval);
			node.outletNodes = [];
			done();
		});
    }
    //RED.nodes.registerType("anel-Connection",anelConnectionNode);
	
	RED.nodes.registerType("anel-connection",anelConnectionNode,{
		credentials: {
			username: {type:"text"},
			password: {type:"password"}
		}
	});
}





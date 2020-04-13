module.exports = function(RED) {
    function anelioNode(config) {
        RED.nodes.createNode(this,config);
		var node = this;
		
		node.server = RED.nodes.getNode(config.server); //get connection node
		
		node.ioNo = config.ioNo;
		if (node.ioNo < 1 || node.ioNo > 8) { node.ioNo = 1; }
		node.onChange = config.onChange;
		node.sendFullMsg = config.fullMsg;
		
		node.lastState = null;
		
		//Subscribe to data updates from the connection node
		node.status({fill:"yellow", shape:"ring", text:"connecting"});
		if (node.server) {
			node.server.subscribe(node);
			node.server.updateState();
		}
		
		node.on('close', function (done) {
			if (node.server) {
				node.server.unsubscribe(node);
			}
			done();
		});
		
		node.onNewData = function(data) {
			if (data.ios && data.ios[node.ioNo-1]) {
				node.status({fill:"green", shape:"dot", text:data.ios[node.ioNo-1].state ? "on" : "off"});
				if (!node.onChange || node.lastState !== data.ios[node.ioNo-1].state) {
					if (node.sendFullMsg) {
						node.send({payload: data});
					} else {
						node.send({payload: data.ios[node.ioNo-1]});
					}
				}
				node.lastState = data.ios[node.ioNo-1].state;
			}
		};
		
		node.onStatus = function(state) {
			if (state === "error") {
				node.status({fill:"red", shape:"ring", text:"connection error"});
			}
		}
        
        node.on('input', function(msg, send, done) {
			if (node.server) {
				var onOff = false;
				if (msg.payload.toString().toLowerCase() === "off" || msg.payload === "0") {
					onOff = false;
				} else if (msg.payload) {
					onOff = true;
				}
				node.server.setOutletOrIo("io",node.ioNo,onOff);
			}
            //msg.payload = msg.payload.toLowerCase();
            //node.send(msg);
			done();
        });
    }
    RED.nodes.registerType("anel-io",anelioNode);
}

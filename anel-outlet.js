module.exports = function(RED) {
    function anelOutletNode(config) {
        RED.nodes.createNode(this,config);
		var node = this;
		
		node.server = RED.nodes.getNode(config.server); //get connection node
		
		node.outletNo = config.outletNo;
		if (node.outletNo < 1 || node.outletNo > 8) { node.outletNo = 1; }
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
			if (data.outlets && data.outlets[node.outletNo-1]) {
				node.status({fill:"green", shape:"dot", text:data.outlets[node.outletNo-1].state ? "on" : "off"});
				if (!node.onChange || node.lastState !== data.outlets[node.outletNo-1].state) {
					if (node.sendFullMsg) {
						node.send({payload: data});
					} else {
						node.send({payload: data.outlets[node.outletNo-1]});
					}
				}
				node.lastState = data.outlets[node.outletNo-1].state;
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
				node.server.setOutletOrIo("sw",node.outletNo,onOff);
			}
            //msg.payload = msg.payload.toLowerCase();
            //node.send(msg);
			done();
        });
    }
    RED.nodes.registerType("anel-outlet",anelOutletNode);
}

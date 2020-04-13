module.exports = function(RED) {
    function anelsensorsNode(config) {
        RED.nodes.createNode(this,config);
		var node = this;
		
		node.server = RED.nodes.getNode(config.server); //get connection node
		
		node.sendFullMsg = config.fullMsg;
		
		
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
			if (data.sensors) {
				node.status({fill:"green", shape:"dot", text:"ok"});
				if (node.sendFullMsg) {
					node.send({payload: data});
				} else {
					node.send({payload: data.sensors});
				}
			}
		};
		
		node.onStatus = function(state) {
			if (state === "error") {
				node.status({fill:"red", shape:"ring", text:"connection error"});
			}
		}
        
    }
    RED.nodes.registerType("anel-sensors",anelsensorsNode);
}

var common = require('./common');

// 房间信息
var room = function (pms) {
	this.id = pms.id;
	this.uid = pms.uid;
	this.name = pms.name;
	this.players = 0;
	this.messages = [];
	this.user_list = [];
	this.create_time = (new Date()).getTime();

	if (!pms.limit_players) {

		pms.limit_players = 0;
	}

	this.limit_players = pms.limit_players;
};

// 加入房间
room.prototype.joinRoom = function (user_data) {

	// 检查房间限制人数
	if (this.limit_players > 0 && this.players >= this.limit_players) {

		throw common.errorStr('房间人数已满', 2);
	}

	let uid = user_data.id;

	if (this.user_list[uid] == undefined) {

		// 把玩家加入房间
		this.user_list[uid] = user_data;

		// 刷新房间人数
		this.players = Object.keys(this.user_list).length;

		// 发送
		// this.sendToRoom('updateRoom');
	}
}

room.prototype.leaveRoom = function (uid) {

	if (this.p1.id == uid) {
		this.p1.online = false;
	}
	if (this.p2.id == uid) {
		this.p2.online = false;
	}
	this.sendToRoom({ cmd: "update_player", p1: this.p1.online, p2: this.p2.online, f: 2, roomid: this.roomid });//更新房间信息

	if (this.p1.online == false && this.p2.online == false) {
		global.deleteRoomListWithKey(this.roomid)
	}
}

room.prototype.getMessage = function (mess) {

	// 初始化在线状态
	mess.online = true;
	
	// 获取玩家信息
	let uinfo = global.user.getData(mess.uid);

	if (!uinfo) {
		
		// 把在线状态设置为离线
		mess.online = false;

		// 获取缓存里的数据
		let cache_key = global.cache.key('User', [mess.uid]);
		uinfo         = global.cache.get(cache_key);
	}

	// 设置玩家信息
	mess.name     = uinfo.name;
	mess.head_img = uinfo.head_img;

	return mess;
}

room.prototype.addMessage = function (mess) {

	this.messages.push(mess);

	let receive_msg = this.getMessage(mess);

	this.sendToRoom("receiveMessage", receive_msg);
}

room.prototype.sendToRoom = function (cmd, rs) {

	if (Object.keys(this.user_list).length == 0) {

		console.log('sendToRoom players 0');
		return false;
	}

	let user_list = this.user_list;

	for (const key in user_list) {
		const val = user_list[key];
		global.send.toUser(val.id, common.jsonStr(cmd, rs));
	}
}


module.exports = room;
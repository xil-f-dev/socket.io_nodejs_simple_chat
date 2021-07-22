// Config
const config = require("./config.json");
const debug = config.debug;

// UUID (channels id)
const { uid } = require("uid");

// Store
const db = require("./store");

// Setup basic express server
const colors = require("colors");
const express = require("express");
const app = express();
const path = require("path");
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const port = process.env.PORT || config.server.port;

// Color theme
colors.setTheme(config.colors);

server.listen(port, () => {
	if (debug) console.log(`Server listening at port ${port}`.debug);
});

// Routing
app.use(express.static(path.join(__dirname, "public")));

// Chatroom
let users = [];
let rooms = db.getData("/rooms");

io.on("connection", (socket) => {
	if (debug) console.log("A new socket connected !".socket);

	socket.join(rooms[0].id); // General

	let addedUser = false;
	socket.on("login", (username) => {
		if (addedUser) return; // Security

		if (debug) console.log("A user join !".socket);

		const user = {
			id: socket.id,
			username: username,
			status: "online",
			status_code: "online", // online || idle || offline || dnd
			level: 0,
			rooms: [rooms[0].id],
		};
		users.push(user);
		console.log(users);
		addedUser = true;
		socket.emit("logged", {
			users: users,
			rooms: rooms,
			messages: db.getData("/messages"),
		});
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit("userlist update", {
			users: users,
		});
	});

	// when the client emits 'new message', this listens and executes
	socket.on("message", (data) => {
		if (data.content.trim().length <= 0) return;
		if (debug) console.log("New  message : ", data);
		if (rooms.findIndex((room) => room.id == data.channel) == -1) return;
		// we tell the client to execute 'new message'
		const message = {
			id: `m_${uid(16)}`,
			author: users.find((user) => user.id == socket.id).username,
			content: data.content,
			channel: data.channel,
		};
		saveMessage(message);
		io.to(data.channel).emit("message", message);
	});
	const saveMessage = (message) => {
		if (db.count("/messages") >= 100) {
			db.delete("/messages[0]");
		}
		db.push("/messages[]", message);
	};

	socket.on("sub channel", (channelid) => {
		let roomid = rooms.find((room) => room.id == channelid).id;
		if (users.find((user) => user.id == socket.id).level < rooms.find((room) => room.id == channelid).level) return;

		socket.join(roomid);
		users.find((user) => user.id == socket.id).rooms.push(roomid);
		io.emit("userlist update", {
			users: users,
		});
	});
	socket.on("channel add", (channel_conf) => {
		if (channel_conf.name.trim().length < 4 || channel_conf.name.trim().length > 20) return;
		if (!(0 <= parseInt(channel_conf.level) <= 5)) return;
		db.push(
			"/rooms[]",
			{
				id: `c_${uid(16)}`,
				name: channel_conf.name.trim(),
				level: parseInt(channel_conf.level),
				default: false,
			},
			true
		);
		rooms = db.getData("/rooms");
		io.emit("roomlist update", rooms);
	});

	// when the user disconnects.. perform this
	socket.on("disconnect", () => {
		if (addedUser) {
			// echo globally that this client has left
			for (let i = 0; i < users.length; i++) {
				if (users[i].id == socket.id) {
					users.splice(i, 1);
				}
			}
			socket.broadcast.emit("userlist update", {
				users: users,
			});
		}
	});
});

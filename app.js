// Config
const config = require("./config");
const debug = config.debug;

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
let rooms = [
	{
		id: "ch1",
		name: "General",
		level: 0,
		default: true,
	},
	{
		id: "ch2",
		name: "Other Room",
		level: 0,
		default: false,
	},
	{
		id: "ch3",
		name: "Room 3",
		level: 2,
		default: false,
	},
];

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
			rooms: [],
		};
		users.push(user);
		console.log(users);
		addedUser = true;
		socket.emit("logged", {
			users: users,
			rooms: rooms,
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
		io.emit("message", {
			author: users.find((item) => item.id == socket.id).username,
			content: data.content,
			channel: data.channel,
		});
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

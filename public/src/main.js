const socket = io();

const channels = document.querySelector("nav.channels");
const messages_container = document.querySelector("main .messages_container");
const connected_users = document.querySelector(".connected_users");
const user_input = document.querySelector(".user_input");
const user_form = document.querySelector(".popup form");
const message_input = document.querySelector(".message_input");
const message_form = document.querySelector(".message_form");
const popup = document.querySelector(".login");
const me_section = document.querySelector(".me");
const channel_add = document.querySelector(".channel_add");

var me = {};
var activeTab = "";

// Focus on username input
window.addEventListener("load", function () {
	user_input.focus();
});

// Users connected management
user_form.addEventListener("submit", (e) => {
	e.preventDefault();
	if (user_input.value.trim() != "") {
		login(user_input.value);
	} else {
		user_input.classList.add("error");
	}
});
const login = (username) => {
	socket.emit("login", username);
};
socket.on("logged", (data) => {
	console.log(data);
	popup.classList.add("hidden");
	me = data.users.find((user) => user.id == socket.id);
	addMe(me);
	updateUsers(data.users);
	updateRooms(data.rooms);
	updateTabs(data.rooms.find((room) => room.default).id);
	updateMessages(data.messages);
	message_input.focus();
});
socket.on("userlist update", (data) => {
	me = data.users.find((user) => user.id == socket.id);
	updateUsers(data.users);
	addMe(me);
});
const updateUsers = (userlist) => {
	connected_users.innerHTML = "";

	userlist.forEach((user) => {
		connected_users.innerHTML += `
		<div class="user" data-presence="${user.presence}">
			<span class="username">${user.username.substring(0, 1)}</span>
			<div class="status-tooltip"><span class="tooltip-username">${user.username}</span><br>${user.status}</div>
		</div>
		`;
	});
};

// Message
message_form.addEventListener("submit", (e) => {
	e.preventDefault();
	if (message_input.value.trim().length <= 0) return;
	socket.emit("message", {
		content: message_input.value.trim(),
		channel: activeTab,
	});
	message_input.value = "";
	message_input.focus();
});
socket.on("message", (message) => {
	addMessage(message);
	if (message.channel != activeTab) {
		notify(message.channel);
	}
});
socket.on("service message", (message) => {
	document.querySelector(`.tab[data-channelid=${activeTab}]`).innerHTML += `
		<div class="message service">
			<div class="avatar ns">
				<span class="username">${message.author.substring(0, 1)}</span></div>
			<div class="content">
				<span class="author">${message.author}</span>
				<p class="text">
				${message.content}
				</p>
			</div>
		</div>`;
});

const updateMessages = (messages) => {
	messages.forEach((msg) => {
		addMessage(msg);
	});
};
const addMessage = (message) => {
	document.querySelector(`.tab[data-channelid=${message.channel}]`).innerHTML += `
		<div class="message" data-messageid="${message.id}">
			<div class="avatar ns" title="${message.author}">
				<span class="username">${message.author.substring(0, 1)}</span>
			</div>
			<div class="content">
				<span class="author">${message.author}</span>
				<p class="text">
				${message.content}
				</p>
			</div>
		</div>`;
};
const notify = (channelid) => {
	document.querySelector(`.channel[data-channelid=${channelid}]`).classList.add("notified");
};

// Rooms
socket.on("roomlist update", (rooms) => updateRooms(rooms));
const updateRooms = (rooms) => {
	channels.innerHTML = "";
	let same_tabs = "";
	let new_tabs = "";
	rooms.forEach((room) => {
		let res = addRoom(room);
		if (res.status == 1) {
			same_tabs += res.html;
		} else if (res.status == 2) {
			new_tabs += res.html;
		}
	});
	messages_container.innerHTML = new_tabs + same_tabs;
	document.querySelectorAll(".channel:not(.locked)").forEach((channel) => {
		channel.addEventListener("click", channelClicked);
	});
	document.querySelector(`.channel[data-channelid="${rooms[0].id}"]`).click();
};
const addRoom = (room) => {
	channels.innerHTML += `<div class="channel${room.level > me.level ? " locked" : ""}" data-channelid="${
		room.id
	}"><span class="name">${room.name}</span></div>`;

	if (room.level > me.level) return { status: 0 };
	if (document.querySelector(`div.tab[data-channelid=${room.id}]`) !== null)
		return { status: 1, html: document.querySelector(`div.tab[data-channelid=${room.id}]`).outerHTML };
	return {
		status: 2,
		html: `
			<div
			data-channelid="${room.id}"
			class="tab"
			></div>
		`,
	};
};
const channelClicked = (e) => {
	const clickedChannel = e.currentTarget;
	if (!me.rooms.includes(clickedChannel.dataset.channelid)) {
		socket.emit("sub channel", clickedChannel.dataset.channelid);
	}
	// Styles
	document.querySelectorAll(".channel").forEach((channel) => {
		channel.classList.remove("active");
	});
	clickedChannel.classList.add("active");
	clickedChannel.classList.remove("notified");
	updateTabs(clickedChannel.dataset.channelid);
};
const updateTabs = (tabId) => {
	activeTab = tabId;
	document.querySelectorAll(".tab").forEach((tab) => {
		tab.classList.remove("tab_active");
	});
	document.querySelector(`.tab[data-channelid = ${tabId}]`).classList.add("tab_active");
	document.querySelector(`input.message_input`).focus();
};
const createChannel = async () => {
	const channel_conf = await Modal({
		title: "Create a channel",
		content: `<div><input name="ch_name" type="text" placeholder="Input here ..."/><input name="level" type="number" placeholder="0" value="0" min="0" max="5" disabled/></div>`,
		closeButton: true,
	});
	socket.emit("channel add", {
		name: channel_conf.ch_name.value,
		level: channel_conf.level.value,
	});
};
channel_add.addEventListener("click", createChannel);

// Me
const addMe = (me) => {
	console.log(me);
	me_section.innerHTML = `
		<div class="avatar" title="${me.username}" data-presence="${me.presence}">
			<span class="letter">${me.username.substring(0, 1)}</span>
		</div>
		<div class="text">
			<div class="username">${me.username}</div>
			<span class="status">${me.status}</span>
		</div>
		<img src="assets/img/settings.svg" class="setings_icon"/>
		`;
};

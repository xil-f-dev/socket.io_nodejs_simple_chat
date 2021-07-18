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
	popup.classList.add("hidden");
	me = data.users.find((user) => user.id == socket.id);
	console.log(me);
	addMe(me);
	updateUsers(data.users);
	updateRooms(data.rooms);
	updateTabs(data.rooms.find((room) => room.default).id);
	message_input.focus();
});
socket.on("userlist update", (data) => {
	updateUsers(data.users);
});
const updateUsers = (userlist) => {
	connected_users.innerHTML = "";

	userlist.forEach((user) => {
		connected_users.innerHTML += `
		<div class="user" title="${user.username}">
		<span class="username">${user.username.substring(0, 1)}</span>
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

const addMessage = (message) => {
	document.querySelector(
		`.tab[data-channelid=${message.channel}]`
	).innerHTML += `
		<div class="message">
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
	document
		.querySelector(`.channel[data-channelid=${channelid}]`)
		.classList.add("notified");
};

// Rooms
const updateRooms = (rooms) => {
	channels.innerHTML = "";
	messages_container.innerHTML = "";
	rooms.forEach((room) => {
		addRoom(room);
	});
	document.querySelectorAll(".channel:not(.locked)").forEach((channel) => {
		channel.addEventListener("click", channelClicked);
	});
};
const addRoom = (room) => {
	channels.innerHTML += `<div class="channel${
		room.level > me.level ? " locked" : ""
	}" data-channelid="${room.id}"><span class="name">${
		room.name
	}</span></div>`;
	if (!room.level > me.level) {
		messages_container.innerHTML += `
		<div
		data-channelid="${room.id}"
		class="tab"
		></div>
		`;
	}
};
const channelClicked = (e) => {
	document.querySelectorAll(".channel").forEach((channel) => {
		channel.classList.remove("active");
	});
	const clickedChannel = e.currentTarget;
	clickedChannel.classList.add("active");
	clickedChannel.classList.remove("notified");
	updateTabs(clickedChannel.dataset.channelid);
};
const updateTabs = (tabId) => {
	activeTab = tabId;
	document.querySelectorAll(".tab").forEach((tab) => {
		tab.classList.remove("tab_active");
	});
	document
		.querySelector(`.tab[data-channelid = ${tabId}]`)
		.classList.add("tab_active");
};

// Me
const addMe = (me) => {
	me_section.innerHTML = `
		<div class="avatar" title="${me.username}" data-status="${me.status_code}">
			<span class="letter">${me.username.substring(0, 1)}</span>
		</div>
		<div class="text">
			<div class="username">${me.username}</div>
			<span class="status">${me.status}</span>
		</div>
		<img src="assets/img/settings.svg" class="setings_icon"/>
		`;
};

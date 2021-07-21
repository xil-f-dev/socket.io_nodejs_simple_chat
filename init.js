(async () => {
	const e = require("fs"),
		s = require("inquirer");
	require("colors");
	var a = new (require("password-validator"))();
	a.is()
		.min(8)
		.is()
		.max(100)
		.has()
		.uppercase()
		.has()
		.lowercase()
		.has()
		.digits(2)
		.has()
		.not()
		.spaces()
		.is()
		.not()
		.oneOf(["Passw0rd", "Password123", "password@1234"]);
	const r = await s.prompt([
			{ name: "port", message: "What's the port on which your application would run", default: "3000" },
			{ type: "list", name: "debug", message: "Use debug logs ?", choices: ["yes", "no"], default: "no" },
			{
				type: "password",
				name: "password",
				message: "Choose an admin password",
				validate: (e) => !!a.validate(e) || a.validate(e, { list: !0 }),
			},
		]),
		n = `{\n    "debug" : ${"yes" == r.debug},\n    "server" : {\n        "port" : ${
			r.port
		}\n    },\n    "colors" : {\n        "debug" : "blue",\n        "user_message" : "green",\n        "socket" : "grey",\n        "verbose" : "cyan",\n        "prompt" : "grey",\n        "info" : "green",\n        "data" : "grey",\n        "help" : "cyan",\n        "warn" : "yellow",\n        "error" : "red"\n    },\n    "admin": {\n        "password": "${
			r.password
		}"\n    }\n}`;
	e.writeFileSync("./config.json", n);
	const o = require("./store");
	o.push("/rooms", [
		{ id: "ch1", name: "General", level: 0, default: !0 },
		{ id: "ch2", name: "Other Room", level: 0, default: !1 },
		{ id: "ch3", name: "Room 3", level: 2, default: !1 },
	]),
		o.push("/users", []);
})();

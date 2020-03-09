
const { Client, Collection } = require("discord.js");
const { readdirSync } = require("fs");
const fs = require("fs");
const vm = require('vm');
const { sep } = require("path");
const { success, error, warning } = require("log-symbols");

const config = require("./config");
const bot = new Client();
const cooldown = new Set();

bot.config = config;


["commands", "aliases"].forEach(x => bot[x] = new Collection());


vm.runInThisContext(fs.readFileSync("Function/console.js"));


const load = (dir = "./commands/") => {

	readdirSync(dir).forEach(dirs => {

		const commands = readdirSync(`${dir}${sep}${dirs}${sep}`).filter(files => files.endsWith(".js"));


		for (const file of commands) {

			const pull = require(`${dir}/${dirs}/${file}`);

			if (pull.help && typeof (pull.help.name) === "string" && typeof (pull.help.category) === "string") {
				if (bot.commands.get(pull.help.name)) return console.warn(`${warning} Two or more commands have the same name ${pull.help.name}.`);

				bot.commands.set(pull.help.name, pull);

				consoleme(_Message, tag.None, `Loaded command ${pull.help.name} [${success}]`, false, false);

			}
			else {

				consoleme(_Message, tag.None, `Error loading command in ${dir}${dirs}. you have a missing help.name or help.name is not a string. or you have a missing help.category or help.category is not a string [${error}]`, false, false);

				continue;
			}

			if (pull.help.aliases && typeof (pull.help.aliases) === "object") {
				pull.help.aliases.forEach(alias => {
					if (bot.aliases.get(alias)) return consoleme(_Message, tag.None, `Two commands or more commands have the same aliases "${alias}" [${warning}]`, false, false);
					bot.aliases.set(alias, pull.help.name);
				});
			}
		}

	});
};


load();


bot.on("ready", () => {
	consoleme(_Message, tag.None, `The Bot is online [${success}]`, true, false);

	bot.user.setStatus("dnd");
	bot.user.setActivity("Status : ON", { type: "WATCHING" });

	bot.guilds.forEach(guilds => {
		consoleme(_Servers, tag.ServName, 	`${guilds.name}`, false, false);
		consoleme(_Servers, tag.ServID,     `${guilds.id}`, false, false);
		consoleme(_Servers, tag.ServCnt,    `${guilds.memberCount}`, true, false);
	});
});

bot.on("message", async message => {

	const prefix = bot.config.prefix;
	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const cmd = args.shift().toLowerCase();

	let command;

	if (message.author.bot || !message.guild) return;

	if (!message.member) message.member = await message.guild.fetchMember(message.author);

	if (!message.content.startsWith(prefix)) return;

	if (cmd.length === 0) return;
	if (bot.commands.has(cmd)) command = bot.commands.get(cmd);
	else if (bot.aliases.has(cmd)) command = bot.commands.get(bot.aliases.get(cmd));

	if (cooldown.has(message.author.id)) {
		message.channel.send("Wait ! \n||`2s max`||")
		.then(function(nive) {
			setTimeout(function() {
				nive.edit("Done.")
			}, 2000)
	      nive.delete(5000)
	    });
	    return;
	 }

	cooldown.add(message.author.id);

	setTimeout(function() {
		cooldown.delete(message.author.id)
	}, 2000)

	if (command) command.run(bot, message, args);

});


bot.login(bot.config.token).catch(console.error());
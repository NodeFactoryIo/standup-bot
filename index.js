"use strict"; // since I hate not using semicolons

/**
 * Required Imports
 *  - dotenv: .env support
 *  - fs: file system support (for reading ./commands)
 *  - mongoose: mongoDB client
 *  - discord.js: discord (duh)
 *  - schedule: for running the cron jobs
 *  - standup.model: the model for the standup stored in mongo
 */
require("dotenv").config();
const fs = require("fs");
const mongoose = require("mongoose");
const { Client, MessageEmbed, Collection } = require("discord.js");
const schedule = require("node-schedule");
const standupModel = require("./models/standup.model");
const showPromptCommand = require("./commands/showPrompt");
const config = require("./__config__")


const PREFIX = config.PREFIX;

// lists .js files in commands dir
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

// init bot client with a collection of commands
const bot = new Client();
bot.commands = new Collection();

// Imports the command file + adds the command to the bot commands collection
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  bot.commands.set(command.name, command);
}

mongoose
.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
})
.catch(() => console.log("Ruh Roh!"));

mongoose.connection.once("open", () => console.log("mongoDB connected"));

bot.once("ready", () => {
  console.log("Discord Bot Ready")
  if(Date.now() < (new Date()).setHours(config.endTime.hour, config.endTime.minute)) {
    promptMembers();
  }
});

// when a user enters a command
bot.on("message", async (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  if (!bot.commands.has(commandName)) return;

  if (message.mentions.users.has(bot.user.id))
    return message.channel.send(":robot:");

  const command = bot.commands.get(commandName);

  if (command.guildOnly && message.channel.type === "dm") {
    return message.channel.send("Hmm, that command cannot be used in a dm!");
  }

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.channel.send(`Error 8008135: Something went wrong!`);
  }
});

bot.on("guildCreate", async (guild) => {
  // creates the text channel
  const channel = await guild.channels.create("daily-standups", {
    type: "text",
    topic: "Scrum Standup Meeting Channel",
  });

  // creates the database model
  const newStandup = new standupModel({
    _id: guild.id,
    channelId: channel.id,
    members: [],
    responses: new Map(),
  });

  newStandup
    .save()
    .then(() => console.log("Howdy!"))
    .catch((err) => console.error(err));

  await channel.send(config.standupIntroMessage);
});

// delete the mongodb entry
bot.on("guildDelete", (guild) => {
  standupModel
    .findByIdAndDelete(guild.id)
    .then(() => console.log("Peace!"))
    .catch((err) => console.error(err));
});

/**
 * This function loops through the days pre-configured on the `__config__.js` file and sets up the stand ups on those .
 */
for (day in config.days) {
  /**
   * Cron Job 1: Go through each member and ask for standup
   */
  schedule.scheduleJob(
    { hour: config.startTime.hour, minute: config.startTime.minute, dayOfWeek: day, tz: configureBot.standups.timezone  },
    (time) => {
      console.log(`[${time}] - CRON JOB 1 START`);
      promptMembers();
    }
  );

  function promptMembers() {
    standupModel
        .find()
        .then((standups) => {
          standups.forEach(async (standup) => {
            const members = new Set();
            standup.members.forEach((member) => {
              members.add(member);
            })
            console.log("Sending prompt to", members);
            members.forEach(async (member) => {
              try {
                const user = await bot.users.fetch(member);
                if(user) {
                  user.send(showPromptCommand.message).catch(e => console.log("Failed to send message to", member, e));
                  console.log("Sent prompt to ", user.username);
                } else {
                  console.log("Failed to send message to", member)
                }
              } catch(e) {
                console.log("Failed to send message to", member, e);
              }
            })
          });
        })
        .catch((err) => console.error(err));
  }

  /**
   * Cron Job 2: Go through each standup and output the responses to the channel
   */
  schedule.scheduleJob(
    { hour: config.endTime.hour, minute: config.endTime.minute, dayOfWeek: day, tz: configureBot.standups.timezone },
    (time) => {
      console.log(`[${time}] - CRON JOB 2 START`);
      standupModel
        .find()
        .then((standups) => {
          standups.forEach((standup) => {
            let memberResponses = [];
            let missingMembers = [];
            standup.members.forEach((id) => {
              if (standup.responses.has(id)) {
                memberResponses.push({
                  name: `-`,
                  value: `<@${id}>\n${standup.responses.get(id)}`,
                });
                standup.responses.delete(id);
              } else {
                missingMembers.push(id);
              }
            });
            let missingString = "Hooligans: ";
            if (!missingMembers.length) missingString += ":man_shrugging:";
            else missingMembers.forEach((id) => (missingString += `<@${id}> `));
            bot.channels.cache
              .get(standup.channelId)
              .send(
                new MessageEmbed(config.dailyStandupSummary)
                  .setDescription(missingString)
                  .addFields(memberResponses)
              );
            standup
              .save()
              .then(() =>
                console.log(`[${new Date()}] - ${standup._id} RESPONSES CLEARED`)
              )
              .catch((err) => console.error(err));
          });
        })
        .catch((err) => console.error(err));
    }
  );
}

bot.login(process.env.DISCORD_TOKEN);

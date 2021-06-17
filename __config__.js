/*
  Use this file to configure the bot's hyper-parameters as well as its default messages.
*/

const { MessageEmbed } = require("discord.js");
const internal = require("stream");

const PREFIX = "!"; // The token used to call functions from the bot. Change this if commands are conflicting with another bot.

const timezone = 'Etc/UTC';

/*
// TODO: minor error handling for config params
if (typeof days != "object" ) {
    throw "Input days as an array of numbers"
};
for (day in days) {
    if (typeof day != "number" ) {
        throw "only numbers allowed"
    } else if (0 > day > 6 ) {
        throw "Days should be a list of numbers from 0 to 6, where 0 = Sunday";
    }
};
*/

// Below are the welcome messages as well as instructions sent to the discord server once the bot is added for the first time.
const standupIntroMessage = new MessageEmbed()
  .setColor("#74DD9F")
  .setTitle("Daily Standup")
  .setURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ") // TODO: Have a useful link here, maybe DAO proposals or treasury/KPI overview?
  .setDescription(
    "This is the newly generated text channel used for daily standups! :tada:"
  )
  .addFields(
    {
      name: "Introduction",
      value: `Hi! I'm Stan D. Upbot and I will be facilitating your daily standups from now on.\nTo view all available commands, try \`${PREFIX}help\`.`,
    },
    {
      name: "How does this work?",
      value: `On the pre-configured days, before the standup time \`${str(startTime.hour)+":"+str(startTime.minutes)+" "+timezone}\`, members would private DM me with the command \`${PREFIX}show\`, I will present the standup prompt and they will type their response using the command \`${PREFIX}reply @<optional_serverId> [your-message-here]\`. I will then save their response in my *secret special chamber of data*, and during the designated standup time, I would present everyone's answer to \`#daily-standups\`.`,
    },
    {
      name: "Getting started",
      value: `*Currently*, there are no members in the standup! To add a member try \`${PREFIX}am <User>\`.`,
    }
  )
  .setFooter(
    "https://github.com/nodefactoryio/standup-bot",
    "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
  )
  .setTimestamp();

const dailyStandupSummary = new MessageEmbed()
  .setColor("#74DD9F")
  .setTitle("Daily Standup")
  .setURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
  .setFooter(
    "https://github.com/nodefactoryio/standup-bot",
    "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
  )
  .setTimestamp();
require("dotenv").config();
const Discord = require("discord.js");
const express = require("express");
const config = require("../config");
const randomMints = require("./RandomMints/randomMints").randomMints;
const listingsAndSales =
  require("./ListingsAndSales/listingsAndSales").listingsAndSales;

const app = express();
const port = process.env.PORT || 3000;
app.use(express.static(__dirname + "/public"));
app.listen(port, function () {
  console.log("Server is listening on port ", port);
});

const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

setInterval(async function () {
  await listingsAndSales.sendMessages(client);
}, config.listsAndSalesIntervalSeconds * 1000);

client.on("messageCreate", async (msg) => {
  if (msg.content.startsWith("#")) {
    randomMints.routeMessage(msg);
  }
});

client.login(process.env.CLIENT_TOKEN);

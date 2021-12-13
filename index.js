require("dotenv").config();
const Discord = require("discord.js");
const ethers = require("ethers");

const randomMints = require("./RandomMints/randomMints").randomMints;

const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// async function sendSalesMessages(timestamp) {
//   const params = new URLSearchParams({
//     offset: "0",
//     event_type: "successful",
//     only_opensea: "false",
//     occurred_after: timestamp.toString(),
//     collection_slug: process.env.COLLECTION_SLUG,
//     asset_contract_address: process.env.CONTRACT_ADDRESS,
//   });
//
//   let responseTxt = "";
//   try {
//     console.log("https://api.opensea.io/api/v1/events?" + params);
//     const responseObj = await fetch(
//       "https://api.opensea.io/api/v1/events?" + params,
//       { headers: { "X-API-KEY": process.env.OPENSEA_TOKEN } }
//     );
//     responseTxt = await responseObj.text();
//     const response = JSON.parse(responseTxt);
//     // return await Promise.all(
//     //   response.asset_events.reverse().map(async (sale) => {
//     //     if (sale.asset.name == null) sale.asset.name = "Unnamed NFT";
//     //     const message = buildSaleMessage(sale);
//     //     return await Promise.all(
//     //       process.env.DISCORD_SALES_CHANNEL_ID.split(";").map(
//     //         async (channel) => {
//     //           return await client.channels.cache.get(channel).send(message);
//     //         }
//     //       )
//     //     );
//     //   })
//     // );
//   } catch (e) {
//     const payload = responseTxt || "";
//
//     if (payload.includes("cloudflare") && payload.includes("1020")) {
//       console.log(
//         "You are being rate-limited by OpenSea. Please retrieve an OpenSea API token here: https://docs.opensea.io/reference/request-an-api-key"
//       );
//     }
//
//     throw e;
//   }
// }

// function buildSaleMessage(sale) {
//   return new Discord.MessageEmbed()
//     .setColor("#0099ff")
//     .setTitle(sale.asset.name + " sold!")
//     .setURL(sale.asset.permalink)
//     .setThumbnail(sale.asset.collection.image_url)
//     .addField("Name", sale.asset.name)
//     .addField(
//       "Amount",
//       `${ethers.utils.formatEther(sale.total_price || "0")}${
//         ethers.constants.EtherSymbol
//       }`
//     )
//     .addField("Buyer", sale?.winner_account?.address)
//     .addField("Seller", sale?.seller?.address)
//     .setImage(sale.asset.image_url)
//     .setTimestamp(Date.parse(`${sale?.created_date}Z`))
//     .setFooter(
//       "Sold on OpenSea",
//       "https://files.readme.io/566c72b-opensea-logomark-full-colored.png"
//     );
// }

// setInterval(async function () {
//   // client.channels.cache.get("919905661943447613").send("hello world");
//   const seconds = parseInt(process.env.SECONDS);
//   // const seconds = parseInt("20400");
//   const timestamp = Math.round(new Date().getTime() / 1000) - seconds;
//   await sendSalesMessages(timestamp);
// }, process.env.SECONDS * 1000);

client.on("messageCreate", async (msg) => {
  if (msg.content.startsWith("#")) {
    randomMints.routeMessage(msg);
  }
});

client.login(process.env.CLIENT_TOKEN);

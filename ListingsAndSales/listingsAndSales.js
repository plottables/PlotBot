const fetch = require("node-fetch");
const Discord = require("discord.js");
const config = require("../config");
const { ethers } = require("ethers");

class ListingsAndSales {
  constructor() {}

  async fetchData(params) {
    let responseText = "";
    try {
      const responseObj = await fetch(
        "https://api.opensea.io/api/v1/events?" + params,
        { headers: { "X-API-KEY": process.env.OPENSEA_TOKEN } }
      );
      responseText = await responseObj.text();
      return JSON.parse(responseText);
    } catch (e) {
      const payload = responseText || "";
      if (payload.includes("cloudflare") && payload.includes("1020")) {
        console.log("You are being rate-limited by OpenSea.");
      }
      console.log(`error: ${e}`);
    }
  }

  async getListingsData(timestamp) {
    return await this.fetchData(
      new URLSearchParams({
        offset: "0",
        event_type: "created",
        only_opensea: "false",
        occurred_after: timestamp.toString(),
        collection_slug: config.collectionSlug,
        asset_contract_address: config.contractAddress,
      })
    );
  }

  async getSalesData(timestamp) {
    return await this.fetchData(
      new URLSearchParams({
        offset: "0",
        event_type: "successful",
        only_opensea: "false",
        occurred_after: timestamp.toString(),
        collection_slug: config.collectionSlug,
        asset_contract_address: config.contractAddress,
      })
    );
  }

  parseAccountInfo(account) {
    let address = account.address;
    let addressPreview = address !== null ? address.slice(0, 8) : "unknown";
    let addressOpenSeaURL = `https://opensea.io/accounts/${address}`;
    let ownerUsername =
      account.user !== null ? account.user.username : "unknown";
    if (ownerUsername === null) {
      ownerUsername = "unknown";
    }
    return `[${addressPreview}](${addressOpenSeaURL}) (${ownerUsername})`;
  }

  buildSalesMessage(sale) {
    return new Discord.MessageEmbed()
      .setColor("#0099ff")
      .setTitle(sale.asset.name)
      .setURL(sale.asset.permalink)
      .addFields({
        name: "Seller",
        value: this.parseAccountInfo(sale.seller),
        inline: true,
      })
      .addFields({
        name: "Buyer",
        value: this.parseAccountInfo(sale.winner_account),
        inline: true,
      })
      .addField(
        "Sold for",
        `${ethers.utils.formatEther(sale.total_price || "0")}${
          ethers.constants.EtherSymbol
        }`
      )
      .addField(
        "Live Script",
        `[view on plottables.io](https://www.plottables.io/token/${sale.asset.token_id})`
      )
      .setImage(sale.asset.image_url)
      .setTimestamp(Date.parse(`${sale?.created_date}Z`));
  }

  buildListingsMessage(listing) {
    let message = new Discord.MessageEmbed()
      .setColor("#0099ff")
      .setTitle(listing.asset.name)
      .setURL(listing.asset.permalink)
      .addFields({
        name: "Owner",
        value: this.parseAccountInfo(listing.seller),
        inline: true,
      });
    if (listing.starting_price === listing.ending_price) {
      message.addField(
        "Fixed Price",
        `${ethers.utils.formatEther(listing.starting_price || "0")}${
          ethers.constants.EtherSymbol
        }`
      );
    } else {
      message
        .addField(
          "Starting Price",
          `${ethers.utils.formatEther(listing.starting_price || "0")}${
            ethers.constants.EtherSymbol
          }`
        )
        .addField(
          "Ending Price",
          `${ethers.utils.formatEther(listing.ending_price || "0")}${
            ethers.constants.EtherSymbol
          }`
        );
    }
    message
      .addField(
        "Live Script",
        `[view on plottables.io](https://www.plottables.io/token/${listing.asset.token_id})`
      )
      .setImage(listing.asset.image_url)
      .setTimestamp(Date.parse(`${listing?.created_date}Z`));
    return message;
  }

  async sendMessages(client) {
    const seconds = parseInt(config.listsAndSalesIntervalSeconds);
    const timestamp = Math.round(new Date().getTime() / 1000) - seconds;

    const salesData = await this.getSalesData(timestamp);
    console.log(`found ${salesData?.asset_events?.length || 0} sales`);
    for (const sale of salesData?.asset_events?.reverse()) {
      const message = this.buildSalesMessage(sale);
      await client.channels.cache
        .get(config.salesChannelId)
        .send({ embeds: [message] });
    }

    const listingsData = await this.getListingsData(timestamp);
    console.log(`found ${listingsData?.asset_events?.length || 0} listings`);
    for (const listing of listingsData?.asset_events?.reverse()) {
      const message = this.buildListingsMessage(listing);
      await client.channels.cache
        .get(config.listingsChannelId)
        .send({ embeds: [message] });
    }
  }
}

module.exports.listingsAndSales = new ListingsAndSales();

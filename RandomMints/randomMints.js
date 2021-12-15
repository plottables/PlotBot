const fetch = require("node-fetch");
const CHANNELS = require("./channels.json");
const config = require("../config");
const Discord = require("discord.js");
const ethers = require("ethers");

class Channel {
  constructor({ name, projects }) {
    this.name = name;
    this.projects = projects;
  }

  getRandomToken() {
    const project =
      this.projects[Math.floor(this.projects.length * Math.random())];
    const tokenNumber = Math.floor(project.editionSize * Math.random());
    return project.projectId * 1000000 + tokenNumber;
  }

  getRandomTokenForProject(projectName) {
    const project = this.projects.filter(
      (project) => project.name.toLowerCase() === projectName
    );
    if (project.length === 0) {
      return -1;
    } else {
      const tokenNumber = Math.floor(project[0].editionSize * Math.random());
      return project[0].projectId * 1000000 + tokenNumber;
    }
  }

  getTokenForProject(tokenNumber, projectName) {
    const project =
      projectName === ""
        ? [this.projects[0]]
        : this.projects.filter(
            (project) => project.name.toLowerCase() === projectName
          );
    if (project.length === 0) {
      return -1;
    } else {
      if (tokenNumber >= 0 && tokenNumber < project[0].editionSize) {
        return project[0].projectId * 1000000 + tokenNumber;
      } else {
        return -2;
      }
    }
  }
}

class RandomMints {
  constructor() {
    this.channels = RandomMints.buildChannelHandlers(CHANNELS);
  }

  static buildChannelHandlers(json) {
    const channels = {};
    Object.entries(json).forEach(([channelId, channelParams]) => {
      channels[channelId] = new Channel(channelParams);
    });
    return channels;
  }

  async buildMessage(msg, tokenId) {
    await fetch(
      `https://api.opensea.io/api/v1/asset/${config.contractAddress}/${tokenId}/`,
      {
        method: "GET",
        headers: {},
      }
    )
      .then((response) => response.json())
      .then((openSeaData) => {
        const embedContent = new Discord.MessageEmbed()
          .setTitle(openSeaData.name)
          .setURL(openSeaData.permalink)
          .setColor("#0099ff")
          .setImage(openSeaData.image_url)
          .addField(
            "Live Script",
            `[view on plottables.io](https://www.plottables.io/token/${tokenId})`
          )
          // .addField("Features", assetFeatures)
          .addField("Total Sales", openSeaData.num_sales.toString())
          .addFields(parseOwnerInfo(openSeaData.owner))
          .addFields(parseSaleInfo(openSeaData.last_sale));
        msg.channel.send({ embeds: [embedContent] });
      });
  }

  routeMessage(msg) {
    const channel = this.channels[msg.channel.id];
    if (channel) {
      if (msg.content.match(/#\?\s*([\w\s]*)/)) {
        const parseMessage = msg.content.match(/#\?\s*([\w\s]*)/);
        if (parseMessage[1] === "") {
          this.buildMessage(msg, channel.getRandomToken());
        } else {
          const tokenId = channel.getRandomTokenForProject(
            parseMessage[1].toLowerCase()
          );
          if (tokenId !== -1) {
            this.buildMessage(msg, tokenId);
          }
        }
      } else if (msg.content.match(/#([0-9]*)\s*([\w\s]*)/)) {
        const parseMessage = msg.content.match(/#([0-9]*)\s*([\w\s]*)/);
        const tokenId = channel.getTokenForProject(
          parseInt(parseMessage[1]),
          parseMessage[2]
        );
        if (tokenId === -1) {
          if (parseMessage[2] === "") {
            msg.channel.send("Please specify the project name...");
          }
        } else if (tokenId === -2) {
          msg.channel.send("Invalid token number...");
        } else {
          this.buildMessage(msg, tokenId);
        }
      }
    }
  }
}

function parseOwnerInfo(ownerAccount) {
  let address = ownerAccount.address;
  let addressPreview = address !== null ? address.slice(0, 8) : "unknown";
  let addressOpenSeaURL = `https://opensea.io/accounts/${address}`;
  let ownerUsername =
    ownerAccount.user !== null ? ownerAccount.user.username : "unknown";
  if (ownerUsername === null) {
    ownerUsername = "unknown";
  }

  return {
    name: "Owner",
    value: `[${addressPreview}](${addressOpenSeaURL}) (${ownerUsername})`,
    inline: false,
  };
}

function parseSaleInfo(saleInfo) {
  if (saleInfo !== null && saleInfo.event_type === "successful") {
    let eventDate = new Date(saleInfo.created_date).toLocaleDateString();
    let sellerAccount = saleInfo.transaction.to_account;
    let sellerAddress;
    let sellerAddressPreview;
    let sellerUsername;
    if (sellerAccount !== null) {
      sellerAddress = sellerAccount.address;
      sellerAddressPreview =
        sellerAddress !== null ? sellerAddress.slice(0, 8) : "unknown";
      sellerUsername =
        sellerAccount.user !== null ? sellerAccount.user.username : "unknown";
      if (sellerUsername === null) {
        sellerUsername = "unknown";
      }
    }

    return {
      name: "Last Sale",
      value: `Sold for ${ethers.utils.formatEther(
        saleInfo.total_price || "0"
      )}${
        ethers.constants.EtherSymbol
      } by [${sellerAddressPreview}](https://opensea.io/accounts/${sellerAddress}) (${sellerUsername}) on ${eventDate}`,
      inline: false,
    };
  }
  return {
    name: "Last Sale",
    value: "N/A",
    inline: false,
  };
}

module.exports.randomMints = new RandomMints();

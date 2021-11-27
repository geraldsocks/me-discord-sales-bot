const fetch = require('node-fetch');
//const tweet = require('./tweet');
const dotenv = require("dotenv")
const Discord = require('discord.js');

const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS]
});

dotenv.config()

const collectionName = process.env.COLLECTION_NAME

// Format tweet text
// function formatAndSendTweet(tweetText,imageUrl) {
//     //console.log(tweetText);
//     return tweet.tweetWithImage(tweetText, imageUrl);
//     //return tweet.tweet(tweetText);
// }

const fetchMagicEdenNFT = (mint) => {
    return new Promise((resolve) => {
        fetch(`https://api-mainnet.magiceden.io/rpc/getNFTByMintAddress/${mint}`).then((res) => {
            res.json().then((data) => {
                resolve(data.results);
            });
        });
    });
}

const getHistoryMagicEdenSales = (collection) => {
    return new Promise((resolve) => {
        const query = decodeURI(escape(JSON.stringify({
            $match: {
                collection_symbol: collection,
                txType: 'exchange'
            },
            $sort: {
                blockTime: -1
            },
            $skip: 0,
            $limit: 10
        })));
        fetch(`https://api-mainnet.magiceden.io/rpc/getGlobalActivitiesByQuery?q=${query}`).then((res) => {
            res.json().then((data) => {
                resolve(data.results);
            });
        });
    });
}

const getHistoryMagicEdenAcceptBid = (collection) => {
    return new Promise((resolve) => {
        const query = decodeURI(escape(JSON.stringify({
            $match: {
                collection_symbol: collection,
                txType: 'acceptBid'
            },
            $sort: {
                blockTime: -1
            },
            $skip: 0,
            $limit: 10
        })));
        fetch(`https://api-mainnet.magiceden.io/rpc/getGlobalActivitiesByQuery?q=${query}`).then((res) => {
            res.json().then((data) => {
                resolve(data.results);
            });
        });
    });
}

const synchronizeMagicEden = () => {
    [
    collectionName
    ].forEach((collection) => {

        getHistoryMagicEdenSales(collection).then((events) => {

            console.log(`${new Date().toJSON()} Checking ${collectionName} Sales`)

            const sortedEvents = events
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

            if (!sortedEvents.length) return;
            
            const newEvents = sortedEvents
                .filter((e) => new Date(e.createdAt).getTime() > new Date(Date.now()).getTime() - process.env.INTERVAL_MILLISECONDS);

            if (!newEvents.length) return;

            newEvents.reverse().forEach(async (event) => {

                if (!event.parsedTransaction) return;

                const nft = await fetchMagicEdenNFT(event.parsedTransaction.mint);
                
                // const attributes = nft.attributes;

                // attributes.forEach(attribute => {
                //     switch (attribute.trait_type) {
                //         case `Background`:
                //             attrBackground = attribute.value;
                //         case `Sock Color`:
                //             attrSockColor = attribute.value;
                //     }
                // })

                const tweetImg = `${nft.img}`;

                switch (event.source) {
                    case `magiceden`:
                        sourceName = `on Magic Eden`;
                        sourceURL = `https://magiceden.io/item-details/${event.mint}`
                        tweetText = `${nft.title} bought for ${(event.parsedTransaction.total_amount / 10E8).toFixed(2)} SOL ${sourceName} ${sourceURL}`;
                        console.log(`${tweetText} ${tweetImg}`);

                        const embed = new Discord.MessageEmbed()
                            .setTitle(`${nft.title}`)
                            .setURL(`https://magiceden.io/item-details/${event.mint}`)
                            .addField('Price', `${(event.parsedTransaction.total_amount / 10E8).toFixed(2)} SOL`)
                            .addField('Buyer', event.parsedTransaction.buyer_address)
                            .addField('Seller', event.seller_address)
                            .setImage(nft.img)
                            .setTimestamp(new Date(event.createdAt))
                            .setColor('DARK_AQUA')
                            .setFooter('Magic Eden');

                        client.channels.cache.get(process.env.MAGICEDEN_SALES_CHANNEL_ID).send({
                            embeds: [embed]
                        }).catch(() => {});


                        //return formatAndSendTweet(tweetText,tweetImg);
                        break;
                    case `alphaart`:
                        sourceName = `on alpha art`;
                        sourceURL = `https://alpha.art/t/${event.mint}`
                        tweetText = `${nft.title} bought for ${(event.parsedTransaction.total_amount / 10E8).toFixed(2)} SOL ${sourceName} ${sourceURL}`;
                        console.log(`${tweetText} ${tweetImg}`);
                        //return formatAndSendTweet(tweetText,tweetImg);
                        break;
                    case `digitaleyes`:
                        sourceName = `on Digital Eyes`;
                        sourceURL = `https://digitaleyes.market/item/SolSocks/${event.mint}`
                        tweetText = `${nft.title} bought for ${(event.parsedTransaction.total_amount / 10E8).toFixed(2)} SOL ${sourceName} ${sourceURL}`;
                        console.log(`${tweetText} ${tweetImg}`);
                        //return formatAndSendTweet(tweetText,tweetImg);
                        break;
                    default:
                        sourceName = ``
                        sourceURL = ``
                }
                
                });

            });

        getHistoryMagicEdenAcceptBid(collection).then((events) => {

            console.log(`${new Date().toJSON()} Checking ${collectionName} Accepted Bids`)

            const sortedEvents = events
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

            if (!sortedEvents.length) return;
            
            const newEvents = sortedEvents
                .filter((e) => new Date(e.createdAt).getTime() > new Date(Date.now()).getTime() - process.env.INTERVAL_MILLISECONDS);

            if (!newEvents.length) return;  

            newEvents.reverse().forEach(async (event) => {

                if (!event.parsedTransaction) return;

                const nft = await fetchMagicEdenNFT(event.parsedTransaction.mint);
                
                // const attributes = nft.attributes;

                // attributes.forEach(attribute => {
                //     switch (attribute.trait_type) {
                //         case `Background`:
                //             attrBackground = attribute.value;
                //         case `Sock Color`:
                //             attrSockColor = attribute.value;
                //     }
                // })

                const tweetImg = `${nft.img}`;

                switch (event.source) {
                    case `magiceden`:
                        sourceName = `on Magic Eden`;
                        sourceURL = `https://magiceden.io/item-details/${event.mint}`
                        tweetText = `${nft.title} bid accepted for ${(event.parsedTransaction.total_amount / 10E8).toFixed(2)} SOL ${sourceName} ${sourceURL}`;
                        console.log(`${tweetText} ${tweetImg}`);
                        //return formatAndSendTweet(tweetText,tweetImg);

                        const embed = new Discord.MessageEmbed()
                            .setTitle(`${nft.title}`)
                            .setURL(`https://magiceden.io/item-details/${event.mint}`)
                            .addField('Price', `${(event.parsedTransaction.total_amount / 10E8).toFixed(2)} SOL`)
                            .addField('Buyer', event.parsedTransaction.buyer_address)
                            .addField('Seller', event.seller_address)
                            .setImage(nft.img)
                            .setTimestamp(new Date(event.createdAt))
                            .setColor('DARK_AQUA')
                            .setFooter('Magic Eden');

                        client.channels.cache.get(process.env.MAGICEDEN_SALES_CHANNEL_ID).send({
                            embeds: [embed]
                        }).catch(() => {});


                        break;
                    case `alphaart`:
                        sourceName = `on alpha art`;
                        sourceURL = `https://alpha.art/t/${event.mint}`
                        tweetText = `${nft.title} bid accepted for ${(event.parsedTransaction.total_amount / 10E8).toFixed(2)} SOL ${sourceName} ${sourceURL}`;
                        console.log(`${tweetText} ${tweetImg}`);
                        //return formatAndSendTweet(tweetText,tweetImg);
                        break;
                    case `digitaleyes`:
                        sourceName = `on Digital Eyes`;
                        sourceURL = `https://digitaleyes.market/item/SolSocks/${event.mint}`
                        tweetText = `${nft.title} bid accepted for ${(event.parsedTransaction.total_amount / 10E8).toFixed(2)} SOL ${sourceName} ${sourceURL}`;
                        console.log(`${tweetText} ${tweetImg}`);
                        //return formatAndSendTweet(tweetText,tweetImg);
                        break;
                    default:
                        sourceName = ``
                        sourceURL = ``
                }
                
                });
        });    
    });
};



client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // do not wait the 10s and start syncing right now
    synchronizeMagicEden();
    setInterval(() => synchronizeMagicEden(), process.env.INTERVAL_MILLISECONDS);

});


client.login(process.env.DISCORD_BOT_TOKEN);



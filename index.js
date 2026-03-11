const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

// ضروري جداً لمنصة Render
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot is Online!'));
app.listen(process.env.PORT || 3000);

// تكملة الكود الخاص بك...
const TOKEN = 'MTQ4MDMxMTAyMzYyMDg1Mzk2Mg.GoI6rL.4wmg2ioc-cKXNk152r5TrninFgDbsVySNKPT0c';

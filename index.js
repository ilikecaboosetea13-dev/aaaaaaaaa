const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    PermissionsBitField, 
    REST, 
    Routes, 
    SlashCommandBuilder 
} = require('discord.js');
const fs = require('fs');

// --- التعديل الوحيد للتشغيل على Render ---
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot is Online!'));
app.listen(process.env.PORT || 3000);
// ----------------------------------------

// --- إعدادات البوت (بقيت كما هي) ---
const TOKEN = 'MTQ4MDMxMTAyMzYyMDg1Mzk2Mg.GoI6rL.4wmg2ioc-cKXNk152r5TrninFgDbsVySNKPT0c'; 
const CLIENT_ID = '1480311023620853962'; 

const LOGS = {
    MUTE: "1478383964900036738",
    TIMEOUT: "1478383985938665583",
    WARN: "1478383964900036738"
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// --- نظام النقاط (كما هو) ---
let pointsData = {};
if (fs.existsSync('./points.json')) {
    try {
        pointsData = JSON.parse(fs.readFileSync('./points.json'));
    } catch (e) { pointsData = {}; }
}

function savePoints(userId) {
    pointsData[userId] = (pointsData[userId] || 0) + 1;
    fs.writeFileSync('./points.json', JSON.stringify(pointsData, null, 4));
}

// --- تعريف الأوامر (كما هي) ---
const commands = [
    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('إسكات عضو لفترة محددة')
        .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
        .addIntegerOption(opt => opt.setName('duration').setDescription('المدة بالدقائق').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('السبب')),

    new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('إعطاء تايم أوت لعضو')
        .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
        .addIntegerOption(opt => opt.setName('duration').setDescription('المدة بالدقائق').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('السبب')),

    new SlashCommandBuilder()
        .setName('warn')
        .setDescription('تحذير عضو')
        .addUserOption(opt => opt.setName('user').setDescription('العضو').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('السبب')),

    new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('عرض لوحة شرف الإدارة'),

    new SlashCommandBuilder()
        .setName('say')
        .setDescription('جعل البوت يرسل رسالة إمبد')
        .addStringOption(opt => opt.setName('message').setDescription('الرسالة').setRequired(true))
].map(command => command.toJSON());

// --- تسجيل الأوامر عند التشغيل (كما هي) ---
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async (c) => {
    console.log(`✅ Ready! Logged in as ${c.user.tag}`);
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

// --- معالجة الأوامر (كما هي تماماً) ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, guild, user, member } = interaction;

    if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return interaction.reply({ content: "❌ ليس لديك صلاحية `Moderate Members` لاستخدام هذا الأمر.", ephemeral: true });
    }

    if (commandName === 'mute' || commandName === 'timeout') {
        const target = options.getMember('user');
        const duration = options.getInteger('duration');
        const reason = options.getString('reason') || "لا يوجد سبب";

        if (!target) return interaction.reply("❌ لم يتم العثور على العضو.");
        if (!target.manageable) return interaction.reply("❌ لا يمكنني معاقبة هذا العضو (رتبته أعلى مني).");

        try {
            await target.timeout(duration * 60 * 1000, reason);
            savePoints(user.id);

            const logChannelId = commandName === 'mute' ? LOGS.MUTE : LOGS.TIMEOUT;
            const logChannel = guild.channels.cache.get(logChannelId);
            const endTime = Math.floor((Date.now() + duration * 60 * 1000) / 1000);

            const embed = new EmbedBuilder()
                .setAuthor({ name: `إجراء: ${commandName.toUpperCase()}`, iconURL: user.displayAvatarURL() })
                .setColor(0xE74C3C)
                .setThumbnail(target.user.displayAvatarURL())
                .addFields(
                    { name: '👤 العضو المعاقب', value: `${target} (\`${target.id}\`)`, inline: false },
                    { name: '👮 بواسطة', value: `${user}`, inline: true },
                    { name: '⏳ المدة', value: `${duration} دقيقة`, inline: true },
                    { name: '📝 السبب', value: `\`${reason}\``, inline: false },
                    { name: '📅 ينتهي في', value: `<t:${endTime}:F> (<t:${endTime}:R>)`, inline: false }
                )
                .setFooter({ text: `نقطة إضافية لـ ${user.username}` })
                .setTimestamp();

            if (logChannel) logChannel.send({ embeds: [embed] });
            interaction.reply({ content: `✅ تم تنفيذ الأمر على ${target.user.tag}`, ephemeral: true });

        } catch (error) {
            console.error(error);
            interaction.reply("❌ حدث خطأ أثناء تنفيذ العملية.");
        }
    }

    if (commandName === 'warn') {
        const target = options.getUser('user');
        const reason = options.getString('reason') || "لا يوجد سبب";

        savePoints(user.id);
        const logChannel = guild.channels.cache.get(LOGS.WARN);

        const embed = new EmbedBuilder()
            .setAuthor({ name: `إجراء: WARN`, iconURL: user.displayAvatarURL() })
            .setColor(0xF1C40F)
            .addFields(
                { name: '👤 العضو المحذر', value: `${target}`, inline: true },
                { name: '👮 بواسطة', value: `${user}`, inline: true },
                { name: '📝 السبب', value: `\`${reason}\``, inline: false }
            )
            .setTimestamp();

        if (logChannel) logChannel.send({ embeds: [embed] });
        interaction.reply({ content: `✅ تم تحذير ${target.tag}`, ephemeral: true });
    }

    if (commandName === 'leaderboard') {
        const sorted = Object.entries(pointsData)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        const lbContent = sorted.length > 0 
            ? sorted.map(([id, pts], index) => `**#${index + 1}** | <@${id}> — \`${pts}\` نقطة`).join('\n')
            : "⚠️ لا توجد بيانات نقاط حالياً.";

        const lbEmbed = new EmbedBuilder()
            .setTitle("🏆 لوحة صدارة الإدارة")
            .setDescription(lbContent)
            .setColor(0x2ECC71)
            .setTimestamp();

        interaction.reply({ embeds: [lbEmbed] });
    }

    if (commandName === 'say') {
        const msg = options.getString('message');
        const sayEmbed = new EmbedBuilder()
            .setDescription(msg)
            .setColor(0x3498DB);

        await interaction.channel.send({ embeds: [sayEmbed] });
        interaction.reply({ content: "✅ تم إرسال الإمبد", ephemeral: true });
    }
});

client.login(TOKEN);

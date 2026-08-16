const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("環境変数が設定されていません。");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const command = new SlashCommandBuilder()
  .setName("test")
  .setDescription("Botの耐久テストを実行します")
  .addIntegerOption(option =>
    option
      .setName("count")
      .setDescription("テスト回数（1～20）")
      .setMinValue(1)
      .setMaxValue(20)
      .setRequired(true)
  );

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommand() {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    {
      body: [command.toJSON()]
    }
  );

  console.log("スラッシュコマンドを登録しました。");
}

client.once("ready", () => {
  console.log(`ログインしました: ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "test") return;

  if (!interaction.memberPermissions?.has("Administrator")) {
    return interaction.reply({
      content: "このテストはサーバー管理者のみ実行できます。",
      ephemeral: true
    });
  }

  const count = interaction.options.getInteger("count");

  await interaction.reply(
    `🧪 耐久テスト開始\n回数: ${count}\n間隔: 2秒`
  );

  let success = 0;
  let failed = 0;
  let totalTime = 0;

  for (let i = 1; i <= count; i++) {
    const start = Date.now();

    try {
      await interaction.channel.send(`🧪 テスト ${i}/${count}`);

      const elapsed = Date.now() - start;

      success++;
      totalTime += elapsed;

      console.log(`[${i}/${count}] 成功 ${elapsed}ms`);
    } catch (error) {
      failed++;
      console.error(`[${i}/${count}] 失敗:`, error.message);
    }

    if (i < count) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const average =
    success > 0
      ? Math.round(totalTime / success)
      : 0;

  await interaction.followUp(
    [
      "## 🧪 耐久テスト終了",
      `実行回数: ${count}`,
      `成功: ${success}`,
      `失敗: ${failed}`,
      `平均処理時間: ${average}ms`
    ].join("\n")
  );
});

(async () => {
  try {
    await registerCommand();
    await client.login(TOKEN);
  } catch (error) {
    console.error("起動に失敗しました:", error);
    process.exit(1);
  }
})();

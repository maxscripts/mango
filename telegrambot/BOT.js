const TelegramBot = require("node-telegram-bot-api");
const db = require("./db.js");
const token = process.env.BOT;
const bot = new TelegramBot(token, { polling: true });

bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

const channelName = "@Abboam";
const groupName = "@Abbomatest";

// Function to handle referral registration
bot.onText(/\/start (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const referrerId = match[1];

  // Check if the user is already registered
  db.userExists(chatId, (exists) => {
    if (!exists) {
      // Register the new user
      db.registerUser(chatId, msg.from.first_name);

      // Add the referral if the referrer exists
      db.userExists(referrerId, (referrerExists) => {
        if (referrerExists && referrerId !== chatId) {
          db.addReferral(referrerId, chatId, (err) => {
            if (!err) {
              // Send a message to the referrer
              bot.sendMessage(
                referrerId,
                "You received 0.0012 TON for a successful referral!"
              );
              db.addBalance(referrerId, 0.0014);
            }
          });
        }
      });

      bot.sendMessage(chatId, "Welcome! You have been registered.");
    } else {
      bot.sendMessage(chatId, "You are already registered.");
    }
  });
});

// Registration process
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  db.userExists(chatId, (exists) => {
    if (exists) {
      bot.sendMessage(chatId, "You are already registered.");
      return;
    }

    bot.sendMessage(chatId, "Please join our channel and group to continue.", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Join Channel", url: `https://t.me/${channelName}` }],
          [{ text: "Join Group", url: `https://t.me/${groupName}` }],
          [{ text: "Done", callback_data: "done" }],
        ],
      },
    });
  });
});

bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const userId = callbackQuery.from.id;

  if (callbackQuery.data === "done") {
    try {
      const channelMember = await bot.getChatMember(channelName, userId);
      const groupMember = await bot.getChatMember(groupName, userId);

      const isChannelMember = ["member", "administrator", "creator"].includes(
        channelMember.status
      );
      const isGroupMember = ["member", "administrator", "creator"].includes(
        groupMember.status
      );

      if (isChannelMember && isGroupMember) {
        const userName = callbackQuery.from.first_name || "User";
        db.setUserName(chatId, userName);

        bot.sendMessage(
          chatId,
          `Thank you for joining both the channel and the group, ${userName}! You are now registered.`,
          {
            reply_markup: {
              keyboard: [
                [{ text: "💵 Balance ❤️" }, { text: "💰 Set Wallet 💎" }],
                [{ text: "👥 Referral 🔥" }],
                [{ text: "🔥 Quest ❤️" }, { text: "📊 Top 10 Referrals" }],
                [{ text: "📤 Withdraw 🔥" }],
              ],
              resize_keyboard: true,
              one_time_keyboard: false,
            },
          }
        );
      } else {
        bot.sendMessage(
          chatId,
          "It seems you have not joined both the channel and the group. Please join both and try again."
        );
      }
    } catch (error) {
      console.error("Error:", error);
      bot.sendMessage(chatId, "An error occurred. Please try again.");
    }
  }
});

// Command handlers
bot.onText(/💵 Balance ❤️/, (msg) => {
  const chatId = msg.chat.id;

  db.getBalance(chatId, (balance) => {
    bot.sendMessage(chatId, `Your balance is ${balance || "0.00"} TON.`);
  });
});

bot.onText(/💰 Set Wallet 💎/, (msg) => {
  const chatId = msg.chat.id;

  db.gettonAddress(chatId, (existingAddress) => {
    if (existingAddress) {
      bot.sendMessage(
        chatId,
        `Your Current TON address is: <code>${existingAddress}</code>\n\nTap and hold to copy.`,
        { parse_mode: "HTML" }
      );
    } else {
      bot.sendMessage(chatId, "Please send your TON wallet address:");

      bot.once("message", (msg) => {
        const tonAddress = msg.text;
        const tonAddressRegex = /^[A-Za-z0-9_-]{48}$/;

        if (tonAddressRegex.test(tonAddress)) {
          db.addAddress(chatId, tonAddress);
          bot.sendMessage(
            chatId,
            `Your TON address has been set to: ${tonAddress}`
          );
        } else {
          bot.sendMessage(
            chatId,
            "Invalid TON wallet address. Please try again."
          );
        }
      });
    }
  });
});

bot.onText(/📊 Top 10 Referrals/, (msg) => {
  const chatId = msg.chat.id;

  db.connection.query(
    "SELECT user_name, COUNT(*) AS referral_count FROM referrals JOIN users ON referrals.referrer_id = users.chat_id GROUP BY referrer_id ORDER BY referral_count DESC LIMIT 10",
    (err, results) => {
      if (err) {
        console.error("Error getting top referrals:", err);
        bot.sendMessage(chatId, "Error retrieving top referrals.");
        return;
      }

      if (results.length === 0) {
        bot.sendMessage(chatId, "No referrals yet.");
      } else {
        let leaderboard = "🏆 Top 10 Referrals 🏆\n\n";
        results.forEach((row, index) => {
          leaderboard += `${index + 1}. ${row.user_name}: ${
            row.referral_count
          } referrals\n`;
        });
        bot.sendMessage(chatId, leaderboard);
      }
    }
  );
});

bot.onText(/👥 Referral 🔥/, (msg) => {
  const chatId = msg.chat.id;
  const referral = `https://t.me/ewrgbrt_bot?start=${chatId}`;

  bot.sendMessage(
    chatId,
    `Here's Your Referral link: ${referral}\n\nRefer and Earn More TON!`
  );
});

bot.onText(/🔥 Quest ❤️/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "Subscribe to the YouTube channel and Earn More", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Join Group", url: `https://t.me/Abbomatest` }],
        [
          {
            text: "Subscribe Channel",
            url: `https://www.youtube.com/@MrBeast`,
          },
        ],
        [{ text: "Done", callback_data: "Finished" }],
      ],
    },
  });
});

bot.onText(/📤 Withdraw 🔥/, (msg) => {
  const chatId = msg.chat.id;

  db.getBalance(chatId, (balance) => {
    if (balance >= 1) {
      db.gettonAddress(chatId, (tonAddress) => {
        const tonAddressRegex = /^[A-Za-z0-9_-]{48}$/;

        if (tonAddress && tonAddressRegex.test(tonAddress)) {
          db.addBalance(chatId, -1);
          bot.sendMessage(
            chatId,
            `1 TON has been sent to your address: ${tonAddress}`
          );
        } else {
          bot.sendMessage(
            chatId,
            "Invalid TON wallet address. Please try again."
          );
        }
      });
    } else {
      bot.sendMessage(
        chatId,
        "You have insufficient balance to withdraw 1 TON."
      );
    }
  });
});

bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const userId = callbackQuery.from.id;

  if (callbackQuery.data === "Finished") {
    try {
      const groupMember = await bot.getChatMember(groupName, userId);
      const isGroupMember = ["member", "administrator", "creator"].includes(
        groupMember.status
      );

      if (isGroupMember) {
        bot.sendMessage(
          chatId,
          "Thank you for joining both the Youtube and the group!"
        );
      } else {
        bot.sendMessage(
          chatId,
          "It seems you have not joined the group. Please join and try again."
        );
      }
    } catch (error) {
      console.error("Error:", error);
      bot.sendMessage(chatId, "An error occurred. Please try again.");
    }
  }
});

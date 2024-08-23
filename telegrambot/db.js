const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Max@?1216",
  database: "telegram_bot",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }
  console.log("Connected to database!");
});

function userExists(chatId, callback) {
  connection.query(
    "SELECT 1 FROM users WHERE chat_id = ?",
    [chatId],
    (err, results) => {
      if (err) {
        console.error("Error checking user existence:", err);
        callback(false);
        return;
      }
      callback(results.length > 0);
    }
  );
}

function registerUser(chatId, userName) {
  connection.query(
    "INSERT INTO users (chat_id, user_name) VALUES (?, ?)",
    [chatId, userName],
    (err, result) => {
      if (err) {
        console.error("Error registering user:", err);
      } else {
        console.log(`Registered user ${userName} with chat ID ${chatId}`);
      }
    }
  );
}

function addReferral(referrerId, userId, callback) {
  connection.query(
    "INSERT INTO referrals (referrer_id, referred_id) VALUES (?, ?)",
    [referrerId, userId],
    (err, result) => {
      if (err) {
        console.error("Error adding referral:", err);
        callback(err);
      } else {
        console.log(`Added referral from ${referrerId} to ${userId}`);
        callback(null);
      }
    }
  );
}

function getBalance(chatId, callback) {
  connection.query(
    "SELECT balance FROM users WHERE chat_id = ?",
    [chatId],
    (err, results) => {
      if (err) {
        console.error("Error getting balance:", err);
        callback(null);
      } else {
        callback(results[0] ? results[0].balance : null);
      }
    }
  );
}

function addBalance(chatId, amount) {
  connection.query(
    "UPDATE users SET balance = balance + ? WHERE chat_id = ?",
    [amount, chatId],
    (err, result) => {
      if (err) {
        console.error("Error adding balance:", err);
      } else {
        console.log(`Added ${amount} TON to user with chat ID ${chatId}`);
      }
    }
  );
}

function gettonAddress(chatId, callback) {
  connection.query(
    "SELECT ton_address FROM users WHERE chat_id = ?",
    [chatId],
    (err, results) => {
      if (err) {
        console.error("Error getting TON address:", err);
        callback(null);
      } else {
        callback(results[0] ? results[0].ton_address : null);
      }
    }
  );
}

function addAddress(chatId, tonAddress) {
  connection.query(
    "UPDATE users SET ton_address = ? WHERE chat_id = ?",
    [tonAddress, chatId],
    (err, result) => {
      if (err) {
        console.error("Error adding TON address:", err);
      } else {
        console.log(
          `Added TON address ${tonAddress} for user with chat ID ${chatId}`
        );
      }
    }
  );
}

function setUserName(chatId, userName) {
  connection.query(
    "UPDATE users SET user_name = ? WHERE chat_id = ?",
    [userName, chatId],
    (err, result) => {
      if (err) {
        console.error("Error setting user name:", err);
      } else {
        console.log(
          `Set user name to ${userName} for user with chat ID ${chatId}`
        );
      }
    }
  );
}

module.exports = {
  connection,
  userExists,
  registerUser,
  addReferral,
  getBalance,
  addBalance,
  gettonAddress,
  addAddress,
  setUserName,
};

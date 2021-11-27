import express from "express";
import { getConnection } from "typeorm";
import { Reader } from "../../entities/Reader";
import { Req } from "../../types/networkingTypes";

const handleSendMessage = async (req: Req, res: express.Response) => {
  const { chatId, text } = req.body;

  if (!req.session.userId) {
    return res.json({ error: "not authenticated" });
  }

  if (!chatId || !text) {
    return res.json({ error: "invalid arguments" });
  }

  // const message = await getConnection().query(`
  //   INSERT INTO
  //     message("chatId", "senderId", text)
  //   VALUES
  //     (${parseInt(chatId)}, ${req.session.userId}, '${text}') RETURNING id,
  //     "senderId",
  //     text,
  //     "chatId",
  //     CAST("createdAt" as VARCHAR) as "createdAt",
  //     CAST("updatedAt" as VARCHAR) as "updatedAt";
  // `);

  const message = await getConnection().query(`
    INSERT INTO
      message("chatId", "senderId", text)
    VALUES
      (${parseInt(chatId)}, ${req.session.userId}, '${text}') RETURNING id,
      "senderId",
      text,
      "chatId",
      CAST(date_part('epoch', "createdAt") as VARCHAR) as "createdAt",
      CAST("createdAt" as VARCHAR) as cursor,
      CAST(date_part('epoch', "updatedAt") as VARCHAR) as "updatedAt";
  `);

  await Reader.create({
    messageId: message[0].id,
    userId: req.session.userId,
  }).save();

  const messageToReturn = {
    ...message[0],
    cursor: message[0].cursor.replace(" ", "T"),
  };

  return res.json(messageToReturn);
  // return res.json(messageToReturn);
};

export default handleSendMessage;

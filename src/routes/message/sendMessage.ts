import express from "express";
import { Message } from "../../entities/Message";
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

  const message = await Message.create({
    chatId,
    text,
    senderId: req.session.userId,
  }).save();

  await Reader.create({
    messageId: message.id,
    userId: req.session.userId,
  }).save();

  return res.json(message);
};

export default handleSendMessage;

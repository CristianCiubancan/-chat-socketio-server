import express from "express";
import { Reader } from "../../entities/Reader";
import { Req } from "../../types/networkingTypes";

const handleReadMessage = async (req: Req, res: express.Response) => {
  const { messageId } = req.body;

  if (!req.session.userId) {
    return res.json({ error: "not authenticated" });
  }

  if (!messageId) {
    return res.json({ error: "invalid arguments" });
  }

  const reader = await Reader.create({
    messageId: messageId,
    userId: req.session.userId,
  }).save();

  return res.json(reader);
};

export default handleReadMessage;

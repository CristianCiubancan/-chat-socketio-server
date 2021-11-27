import express from "express";
import { getConnection } from "typeorm";
import { Req } from "../../types/networkingTypes";

const handleReadMessage = async (req: Req, res: express.Response) => {
  const { messageId } = req.body;

  if (!req.session.userId) {
    return res.json({ error: "not authenticated" });
  }
  if (messageId === "undefined") {
    return res.json({ error: "invalid arguments" });
  }

  // const reader = await Reader.create({
  //   messageId: messageId,
  //   userId: req.session.userId,
  // }).save();

  const reader = await getConnection().query(
    `insert into reader("userId", "messageId")
    values (${req.session.userId}, ${messageId})
    ON CONFLICT ("userId", "messageId") DO NOTHING
    returning *`
  );
  if (reader[0]) {
    return res.json(true);
  } else {
    return res.json(false);
  }
};

export default handleReadMessage;

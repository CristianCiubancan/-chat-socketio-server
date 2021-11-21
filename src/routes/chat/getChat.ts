import express from "express";
import { Req } from "../../types/networkingTypes";
import { getConnection } from "typeorm";

const handleGetChat = async (req: Req, res: express.Response) => {
  const { chatId } = req.params;

  if (chatId === "undefined") {
    return res.json({ error: "invalid arguments" });
  }

  const chat = await getConnection().query(
    `
    select c.id, json_build_object( 'senderId', xlm."senderId", 'text', xlm.text, 'chatId', xlm."chatId", 'createdAt', xlm."createdAt", 'readers', xlm.readers ) as "lastMessage", ARRAY( SELECT json_build_object( 'id', scm."memberId", 'profilePicUrl', u."profilePicUrl", 'username', u.username ) FROM chat_members scm JOIN "user" u ON u.id = scm."memberId" where scm."chatId" = c.id ) as members from chat c left join ( SELECT m.id, m."senderId", m.text, m."chatId", m."createdAt", ARRAY( SELECT json_build_object('id', rn."userId") FROM ( select r."userId", r."messageId", u.* from reader r inner join "user" u on u.id = r."userId" ) rn WHERE m.id = rn."messageId" ) as readers FROM MESSAGE m WHERE m."createdAt" in ( SELECT LAST_MESSAGE FROM ( SELECT "chatId", MAX("createdAt") LAST_MESSAGE FROM MESSAGE GROUP BY "chatId" ) LM ) ) xlm on c.id = xlm."chatId" where c.id = ${chatId};   
    `
  );

  return res.json(chat[0]);
};

export default handleGetChat;

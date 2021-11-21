import express from "express";
import { Chat } from "../../entities/Chat";
import { getConnection } from "typeorm";
import { Req } from "../../types/networkingTypes";

const handleCreateChat = async (req: Req, res: express.Response) => {
  const { initiatorId, otherMemberId } = req.body;

  if (!initiatorId || !otherMemberId) {
    return res.json({ error: "invalid arguments" });
  }

  if (initiatorId === otherMemberId) {
    return res.json({ error: "invalid arguments" });
  }

  const existingChat = await getConnection().query(
    `
        select L."chatId" as "id", L."memberId" "initiatorId", R."memberId" "otherMemberId" 
          from chat_members L
        INNER JOIN chat_members R
            on L."chatId" = R."chatId"
            AND L."memberId" = ${initiatorId}
            AND R."memberId" = ${otherMemberId};
        `
  );

  if (existingChat[0]) {
    return res.json({ id: existingChat[0].id });
  } else {
    const newChat = await Chat.create().save();

    await getConnection().query(
      `
          INSERT INTO "chat_members"("memberId", "chatId") 
          VALUES 
            (${initiatorId}, ${newChat.id}),
            (${otherMemberId}, ${newChat.id});
          `
    );

    return res.json(newChat);
  }
};

export default handleCreateChat;

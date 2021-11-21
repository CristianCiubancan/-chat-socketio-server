import express from "express";
import { getConnection } from "typeorm";
import { Req } from "../../types/networkingTypes";

const handleGetMessages = async (req: Req, res: express.Response) => {
  const { limit, cursor, chatId } = req.params;

  if (!chatId || !limit) {
    return res.json({ error: "invalid arguments" });
  }

  const realLimitPlusOne = parseInt(limit) + 1;
  const replacements: any[] = [realLimitPlusOne, chatId];

  if (cursor !== "undefined") {
    replacements.push(new Date(Date.parse(cursor)));
  }

  const posts = await getConnection().query(
    `
  select m.* ,ARRAY( SELECT json_build_object('id', rn."userId") FROM ( select r."userId", r."messageId", u.* from reader r inner join "user" u on u.id = r."userId" ) rn WHERE m.id = rn."messageId" ) as readers
  from message m
  where m."chatId" = $2
  ${cursor !== "undefined" ? `and m."createdAt" < $3` : ""}
  order by m."createdAt" DESC
  limit $1
  `,
    replacements
  );

  return res.json({
    messages: posts.slice(0, limit),
    hasMore: posts.length === realLimitPlusOne,
  });
};

export default handleGetMessages;

import express from "express";
import { getConnection } from "typeorm";
import { Req } from "../../types/networkingTypes";

const handleGetUserChats = async (req: Req, res: express.Response) => {
  if (!req.session.userId) {
    res.status(401);
    return res.json({ error: "not authenticated" });
  }

  const { limit, cursor } = req.params;

  if (limit === "undefined") {
    res.status(400);
    return res.json({
      error: `invalid argument for parameter limit`,
    });
  }

  const numberLimit = parseInt(limit);

  const realLimitPlusOne = numberLimit + 1;
  const replacements: any[] = [realLimitPlusOne];

  if (cursor !== "undefined") {
    replacements.push(new Date(Date.parse(cursor)));
  }
  // THE WAY QUERY USED TO BE, MIGHT NOT BE AS PERFORMANT
  // select cm."chatId" as "id", json_build_object( 'senderId', xlm."senderId", 'text', xlm.text, 'chatId', xlm."chatId", 'createdAt', xlm."createdAt", 'readers', xlm.readers ) as "lastMessage", ARRAY( SELECT json_build_object( 'id', scm."memberId", 'profilePicUrl', u."profilePicUrl", 'username', u.username ) FROM chat_members scm JOIN "user" u ON u.id = scm."memberId" where scm."chatId" = cm."chatId" ) as members from chat_members cm join ( SELECT m.id, m."senderId", m.text, m."chatId", m."createdAt", ARRAY( SELECT json_build_object('id', rn."userId") FROM ( select r."userId", r."messageId", u.* from reader r inner join "user" u on u.id = r."userId" ) rn WHERE m.id = rn."messageId" ) as readers FROM MESSAGE m WHERE m."createdAt" in ( SELECT LAST_MESSAGE FROM ( SELECT "chatId", MAX("createdAt") LAST_MESSAGE FROM MESSAGE GROUP BY "chatId" ) LM ) ) xlm on cm."chatId" = xlm."chatId"
  // where cm."memberId" = ${req.session.userId}
  // ${cursor !== "undefined" ? `and xlm."createdAt" < $2` : ""}
  // ORDER BY xlm."createdAt" DESC
  // limit $1;

  const chats = await getConnection().query(
    `
    select
      cm."chatId" as "id",
      json_build_object(
        'senderId',
        xlm."senderId",
        'text',
        xlm.text,
        'chatId',
        xlm."chatId",
        'createdAt',
        xlm."createdAt",
        'readers',
        xlm.readers
      ) as "lastMessage",
      ARRAY(
        SELECT
          json_build_object(
            'id',
            scm."memberId",
            'profilePicUrl',
            u."profilePicUrl",
            'username',
            u.username
          )
        FROM
          chat_members scm
          JOIN "user" u ON u.id = scm."memberId"
        where
          scm."chatId" = cm."chatId"
      ) as members
    from
      chat_members cm
      join (
        SELECT
          m.id,
          m."senderId",
          m.text,
          m."chatId",
          m."createdAt",
          ARRAY(
            SELECT
              json_build_object('id', rn."userId")
            FROM
              (
                select
                  r."userId",
                  r."messageId",
                  u.*
                from
                  reader r
                  inner join "user" u on u.id = r."userId"
              ) rn
            WHERE
              m.id = rn."messageId"
          ) as readers
        FROM
          MESSAGE m
        WHERE
          m."createdAt" in (
            SELECT
              LAST_MESSAGE
            FROM
              (
                SELECT
                  "chatId",
                  MAX("createdAt") LAST_MESSAGE
                FROM
                  MESSAGE			  
                GROUP BY
                  "chatId"
              ) LM
          )
          ${cursor !== "undefined" ? `and m."createdAt" < $2` : ""}
      ) xlm on cm."chatId" = xlm."chatId"
    where
      cm."memberId" = ${req.session.userId}
    ORDER BY
      xlm."createdAt" DESC
    limit
      $1;
    `,
    replacements
  );

  return res.json({
    chats: chats.slice(0, limit),
    hasMore: chats.length === realLimitPlusOne,
  });

  // const chats = await getConnection().query(
  //   `
  //   select cm."chatId" as "id", json_build_object( 'senderId', xlm."senderId", 'text', xlm.text, 'chatId', xlm."chatId", 'createdAt', xlm."createdAt", 'readers', xlm.readers ) as "lastMessage", ARRAY( SELECT json_build_object( 'id', scm."memberId", 'profilePicUrl', u."profilePicUrl", 'username', u.username ) FROM chat_members scm JOIN "user" u ON u.id = scm."memberId" where scm."chatId" = cm."chatId" ) as members from chat_members cm join ( SELECT m.id, m."senderId", m.text, m."chatId", m."createdAt", ARRAY( SELECT json_build_object('id', rn."userId") FROM ( select r."userId", r."messageId", u.* from reader r inner join "user" u on u.id = r."userId" ) rn WHERE m.id = rn."messageId" ) as readers FROM MESSAGE m WHERE m."createdAt" in ( SELECT LAST_MESSAGE FROM ( SELECT "chatId", MAX("createdAt") LAST_MESSAGE FROM MESSAGE GROUP BY "chatId" ) LM ) ) xlm on cm."chatId" = xlm."chatId" where cm."memberId" = ${req.session.userId};
  //   `
  // );

  // const sortedChats = chats.sort((a: any, b: any) => {
  //   const aDate = new Date(a.lastMessage.createdAt).getTime();
  //   const bDate = new Date(b.lastMessage.createdAt).getTime();
  //   return bDate - aDate;
  // });

  // return res.json(sortedChats);
};

export default handleGetUserChats;

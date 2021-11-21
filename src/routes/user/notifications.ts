import express from "express";
import groupBy from "../../utils/groupArrOfObjByValueOrKey";
import { getConnection } from "typeorm";
import { Req } from "../../types/networkingTypes";

interface Reader {
  userId: number;
}

const handleGetNotifications = async (req: Req, res: express.Response) => {
  if (!req.session.userId) return res.json(null);

  const notifications = await getConnection().query(
    `select t1.id "messageId", t1."chatId", reader."userId", t1."senderId" from message as t1 join (select "chatId", max("createdAt") last_message from message where "chatId" in (select "chatId" from chat_members where "memberId"=${req.session.userId}) group by "chatId") as t2 on t2.last_message = t1."createdAt" join reader on reader."messageId" = t1.id;`
  );

  const groupedNotification = Object.entries(
    groupBy("messageId")(notifications)
  ).map(([a, b]) => {
    return { [a]: b };
  });

  let newNotifications = [];

  for (let obj in groupedNotification) {
    const currentChat: Array<Object> = Object.values(
      groupedNotification[obj]
    )[0] as Object[];
    let isChatReadByMe = false;
    for (let person in currentChat) {
      const reader = currentChat[person] as Reader;
      if (reader.userId === req.session.userId) {
        isChatReadByMe = true;
      }
    }
    if (!isChatReadByMe) {
      newNotifications.push(currentChat[0]);
    }
  }

  return res.json(newNotifications);
};

export default handleGetNotifications;

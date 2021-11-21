import express from "express";
import { getConnection } from "typeorm";
import { Req } from "../../types/networkingTypes";

const handleUsers = async (req: Req, res: express.Response) => {
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

  const users = await getConnection().query(
    `
  select u."id", u."username", u."profilePicUrl", u."createdAt" from "user" u 
  ${
    req.session.userId
      ? `where id <> ${req.session.userId}
        ${cursor !== "undefined" ? `and u."createdAt" < $2` : ""}`
      : `${cursor !== "undefined" ? `where u."createdAt" < $2` : ""}`
  } 
  ORDER BY u."createdAt" DESC
  limit $1;
  `,
    replacements
  );

  return res.json({
    users: users.slice(0, limit),
    hasMore: users.length === realLimitPlusOne,
  });
};

export default handleUsers;

import express from "express";
import { getConnection } from "typeorm";
import { Req } from "../../types/networkingTypes";

const handleMe = async (req: Req, res: express.Response) => {
  if (!req.session.userId) {
    return res.json({ error: "not authenticated" });
  }

  const me = await getConnection().query(
    `select u."id",u.username , u."profilePicUrl"  from "user" u where u."id" = ${req.session.userId}`
  );
  if (me) {
    return res.json(me[0]);
  } else {
    return res.json(null);
  }
};

export default handleMe;

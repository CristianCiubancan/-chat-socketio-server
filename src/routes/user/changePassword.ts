import express from "express";
import { Req } from "../../types/networkingTypes";
import { FORGET_PASSWORD_PREFIX } from "../../constants";
import Redis from "ioredis";
import { User } from "../../entities/User";
import argon2 from "argon2";
import { getConnection } from "typeorm";

const handleChangePassword = async (
  req: Req,
  res: express.Response,
  redis: Redis.Redis | Redis.Cluster
) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    res.status(400);
    return res.json({
      error: "invalid arguments",
    });
  }

  if (newPassword.length <= 6) {
    return res.json({
      errors: [
        {
          field: "newPassword",
          message: "length must be greater than 6",
        },
      ],
    });
  }

  const key = FORGET_PASSWORD_PREFIX + token;
  const userId = await redis.get(key);
  if (!userId) {
    return res.json({
      errors: [
        {
          field: "token",
          message: "token expired",
        },
      ],
    });
  }

  const userIdNum = parseInt(userId);
  const user = await getConnection().query(
    `select u."id",u.username , u."profilePicUrl"  from "user" u where u."id" = ${userIdNum}`
  );

  if (!user) {
    return res.json({
      errors: [
        {
          field: "token",
          message: "user no longer exists",
        },
      ],
    });
  }

  await User.update(
    { id: userIdNum },
    {
      password: await argon2.hash(newPassword),
    }
  );

  await redis.del(key);

  req.session.userId = user[0].id;

  return res.json(user[0]);
};

export default handleChangePassword;

import express from "express";
import { Req } from "../../types/networkingTypes";
import { User } from "../../entities/User";
import { v4 } from "uuid";
import { FORGET_PASSWORD_PREFIX } from "../../constants";
import Redis from "ioredis";
import { sendEmail } from "../../utils/sendEmail";

const handleForgotPassword = async (
  req: Req,
  res: express.Response,
  redis: Redis.Redis | Redis.Cluster
) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    return res.json({
      error: "invalid arguments",
    });
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.json(true);
  }

  const token = v4();

  await redis.set(
    FORGET_PASSWORD_PREFIX + token,
    user.id,
    "ex",
    1000 * 60 * 60 * 24 * 3
  );
  await sendEmail(
    email,
    "forgotten password",
    `<a href="${process.env.CORS_ORIGIN}/change-password/${token}">reset password</a>`
  );

  return res.json(true);
};

export default handleForgotPassword;

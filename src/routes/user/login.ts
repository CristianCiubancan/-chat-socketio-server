import express from "express";
import argon2 from "argon2";
import { Req } from "../../types/networkingTypes";
import { User } from "../../entities/User";

const handleLogin = async (req: Req, res: express.Response) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    res.status(400);
    return res.json({
      error: "invalid arguments",
    });
  }

  const user = await User.findOne(
    usernameOrEmail.includes("@")
      ? { where: { email: usernameOrEmail } }
      : { where: { username: usernameOrEmail } }
  );

  if (!user) {
    return res.json({
      errors: [
        {
          field: "usernameOrEmail",
          message: "username doesn't exist",
        },
      ],
    });
  }

  const valid = await argon2.verify(user.password, password);

  if (!valid) {
    return res.json({
      errors: [
        {
          field: "password",
          message: "password doesn't match",
        },
      ],
    });
  }

  req.session.userId = user.id;
  req.session.save();

  return res.json({ user: { ...user, password: "" } });
};

export default handleLogin;

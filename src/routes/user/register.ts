import express from "express";
import argon2 from "argon2";
import { validateRegsiter } from "../../utils/validateRegister";
import { getConnection } from "typeorm";
import { Req } from "../../types/networkingTypes";
import { User } from "../../entities/User";

const handleRegister = async (req: Req, res: express.Response) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400);
    return res.json({ error: "invalid arguments" });
  }

  const errors = validateRegsiter(req.body);
  if (errors) {
    return res.json({ errors });
  }

  const hashedPassword = await argon2.hash(password);

  let user;

  try {
    const result = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({
        username,
        email,
        password: hashedPassword,
      })
      .returning("*")
      .execute();
    user = result.raw[0];
  } catch (err) {
    if (err.code === "23505") {
      if (err.detail.includes("email")) {
        return res.json({
          errors: [
            {
              field: "email",
              message: "email is already taken",
            },
          ],
        });
      } else if (err.detail.includes("username")) {
        return res.json({
          errors: [
            {
              field: "username",
              message: "username is already taken",
            },
          ],
        });
      }
    }
  }

  req.session.userId = user.id;
  req.session.save();

  return res.json({ user: { ...user, password: "" } });
};

export default handleRegister;

import "reflect-metadata";
import "dotenv-safe/config";
import { createConnection } from "typeorm";
import { COOKIE_NAME, SOCKET_USER, __prod__ } from "./constants";
import { User } from "./entities/User";
import express from "express";
import * as socketio from "socket.io";
import session from "express-session";
import * as http from "http";
import connectRedis from "connect-redis";
import cors from "cors";
import path from "path";
import multer from "multer";
import { Emitter } from "@socket.io/redis-emitter";
import { createAdapter } from "@socket.io/redis-adapter";
import { Req } from "./types/networkingTypes";
import handleLogin from "./routes/user/login";
import handleUsers from "./routes/user/users";
import { buildRedisClient } from "./redis";
import Redis from "ioredis";
import { Chat } from "./entities/Chat";
import { ChatMembers } from "./entities/ChatMembers";
import { Message } from "./entities/Message";
import { Reader } from "./entities/Reader";
import handleCreateChat from "./routes/chat/createChat";
import handleGetMessages from "./routes/message/messages";
import handleRegister from "./routes/user/register";
import handleGetChat from "./routes/chat/getChat";
import handleGetUserChats from "./routes/chat/getUserChats";
import handleLogout from "./routes/user/logout";
import handleMe from "./routes/user/me";
import handleSendMessage from "./routes/message/sendMessage";
import handleReadMessage from "./routes/message/readMessage";
import handleForgotPassword from "./routes/user/forgotPassword";
import handleChangePassword from "./routes/user/changePassword";
import handleGetNotifications from "./routes/user/notifications";
import handleChangeProfilePic from "./routes/user/changeProfilePic";

const appid = process.env.APPID;

const main = async () => {
  //Redis
  const redisClient = __prod__
    ? buildRedisClient()
    : new Redis({ host: "localhost", port: 6379 });
  const pubClient = __prod__
    ? buildRedisClient()
    : new Redis({ host: "localhost", port: 6379 });
  const subClient = pubClient?.duplicate();

  if (redisClient) {
    // connectiong to pg database
    // const conn =
    await createConnection({
      type: "postgres",
      host: process.env.DATABASE_HOST,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_DB,
      logging: false,
      // ssl: __prod__ ? { rejectUnauthorized: false } : false,
      ssl: false,
      synchronize: true,
      migrations: [path.join(__dirname, "./migrations/*")],
      entities: [User, Chat, ChatMembers, Message, Reader],
    });

    // running migrations as synchronize:true is not reccomended
    // because it might break the db in prod
    // await conn.runMigrations() ;

    //initializing express app
    const app = express();

    //setup to store session inside Redis
    const RedisStore = connectRedis(session);

    //cors options for http and socket servers
    const serverCorse = {
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    };

    //cookie setup
    const sessionMiddleware = session({
      store: new RedisStore({
        client: redisClient,
        disableTouch: true,
      }),
      name: COOKIE_NAME,
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: __prod__, //cookie only works in https
        domain: __prod__ ? ".happyoctopus.net" : undefined, //de scos secure false si de folosit ce e comentat
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
      },
    } as any);

    //this is needed in order to get cookies working i guess
    app.set("trust proxy", 1);

    //adding cors
    app.use(cors(serverCorse));

    //adding body parser
    app.use(express.json());

    //using cookie session
    app.use(sessionMiddleware);

    //initializing http server
    const server = http.createServer(app);

    //initializing socket server
    const io = new socketio.Server(server, {
      cors: serverCorse,
    });

    //io adapter for broadcasting
    io.adapter(createAdapter(pubClient, subClient));

    //io emitter
    const emitter = new Emitter(pubClient);

    //adding cookie session to socket server
    io.use((socket, next) => {
      sessionMiddleware(
        socket.request as express.Request,
        (socket.request as express.Request).res as express.Response,
        next as express.NextFunction
      );
    });

    //http paths
    app.get("/", (_req: Req, res) => {
      res.json(`hello from ${appid}`);
    });

    app.get("/me", (req: Req, res) => {
      handleMe(req, res);
    });

    app.get("/userNotifications", (req: Req, res) => {
      handleGetNotifications(req, res);
    });

    app.get("/logout", (req: Req, res) => {
      handleLogout(req, res);
    });

    app.get("/userChats/:limit&:cursor", (req: Req, res) => {
      handleGetUserChats(req, res);
    });

    app.post("/sendMessage", (req: Req, res) => {
      handleSendMessage(req, res);
    });

    app.post("/readMessage", (req: Req, res) => {
      handleReadMessage(req, res);
    });

    app.get("/getChat/:chatId", (req: Req, res) => {
      handleGetChat(req, res);
    });

    app.get("/getMessages/:limit&:chatId&:cursor", (req: Req, res) => {
      handleGetMessages(req, res);
    });

    app.get("/users/:limit&:cursor", (req: Req, res) => {
      handleUsers(req, res);
    });

    app.post("/register", (req, res) => {
      handleRegister(req, res);
    });

    app.post("/createChat", (req, res) => {
      handleCreateChat(req, res);
    });

    app.post("/login", (req, res) => {
      handleLogin(req, res);
    });

    app.post("/forgotPassword", (req, res) => {
      handleForgotPassword(req, res, redisClient);
    });

    app.post("/changePassword", (req, res) => {
      handleChangePassword(req, res, redisClient);
    });

    //multer for file upload
    const upload = multer({});

    app.post("/changeProfilePic", upload.single("file"), (req, res) => {
      handleChangeProfilePic(req, res);
    });

    //ws paths
    io.on("connection", async (socket) => {
      const userId = (socket.request as Req).session.userId;
      if (userId) {
        await redisClient.del(SOCKET_USER + userId);
        await redisClient.set(SOCKET_USER + userId, socket.id);
      }
      console.log(`user: ${userId} connected wiht with socket ${socket.id}`);

      socket.on("message", async (message) => {
        const receiverSocketId = await redisClient.get(
          SOCKET_USER + message.to
        );

        console.log(
          `${socket.id} sent a message to user with socket ${receiverSocketId}`
        );

        emitter.to(receiverSocketId!).emit("new-message", { message });
      });

      socket.on("disconnect", async () => {
        if (userId) {
          console.log(`${userId} disconnected`);
          await redisClient.del(SOCKET_USER + userId);
        }
      });
    });

    server.listen(process.env.SERVER_PORT, () => {
      console.log(
        `server listening at http://localhost:${process.env.SERVER_PORT}`
      );
    });
  } else {
    console.log("redis cluster does not exist");
  }
};

main();

import { Request } from "express";
import crypto from "crypto-js";
import CONFIG from "../../../../config.json";
import { db } from "../../../db";
import { User } from "../../../db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
const accessExpiry = 20 * 60;
const refreshExpiry = 86400 * 120; //1hour

export async function login(req: Request) {
  const { user, pass } = req.body;
  const userData = (await db.select().from(User).where(eq(User.name, user)))[0];
  if (!userData) {
    return { error: "User not found" };
  }
  if (checkPassword(pass, userData.hash)) {
    return {
      user: userData.name,
      access: userData.access,
      accessToken: signToken({ user, type: "access", expires: "" }),
      refreshToken: signToken({ user, type: "refresh", expires: "" }),
    };
  } else {
    return { error: "Wrong password" };
  }
}
export async function loginToken(req: Request) {
  const { token } = req.body;
  if (await verify(token.refreshToken.token, token.user, "refresh")) {
    const userData = (
      await db.select().from(User).where(eq(User.name, token.user))
    )[0];
    if (!userData) {
      return { error: "User not found" };
    }
    return {
      user: userData.name,
      access: userData.access,
      accessToken: signToken({
        user: userData.name,
        type: "access",
        expires: "",
      }),
      refreshToken: signToken({
        user: userData.name,
        type: "refresh",
        expires: "",
      }),
    };
  } else {
    return { error: "Token invalid" };
  }
}
export async function create(req: Request) {
  const { user } = req.body;
  let password = createPassword();
  let hash = encrypt(password);
  await db.insert(User).values({ hash, access: 2, name: user });
  return {password};
}
export async function resetPassword(req: Request) {
  const { user } = req.body;
  let password = createPassword();
  let hash = encrypt(password);
  await db.update(User).set({ hash }).where(eq(User.name, user));
  return { password };
}
export async function getUsers() {
  return await db.select({ name: User.name, access: User.access }).from(User);
}
export async function verify(token, user: string, type: "access" | "refresh") {
  let status = true;
  jwt.verify(token, CONFIG.salt, function (err, decoded) {
    if (err) {
      status = false;
    } else {
      if (decoded.payload.user != user || decoded.payload.type != type) {
        status = false;
      }
    }
  });
  //Check revoked token
  return status;
}
function signToken(payload: {
  user: string;
  type: "access" | "refresh";
  expires: string;
}) {
  let expiry = 0;
  if (payload.user) {
    switch (payload.type) {
      case "refresh":
        expiry = refreshExpiry;
        break;
      case "access":
        expiry = accessExpiry;
        break;
    }
    let expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expiry);
    payload.expires = expiryDate.toLocaleString("en-US", {
      timeZone: "America/Toronto",
    });
    let token = jwt.sign({ payload }, CONFIG.salt, {
      expiresIn: expiry,
    });

    if (payload.type == "refresh") {
      let params = {
        RefreshToken: token,
        User: payload.user,
        ExpiryDateTime: payload.expires.replace(",", ""),
      };
      //LOG REFRESH
    }
    return {
      token: token,
      expires: payload.expires,
    };
  } else {
    return false;
  }
}
export function createPassword() {
  return crypto.AES.encrypt(Math.random().toString(), CONFIG.salt)
    .toString()
    .slice(-12);
}
export function encrypt(text: string) {
  return crypto.AES.encrypt(text, CONFIG.salt).toString();
}
export function checkPassword(text: string, hash: string) {
  return (
    text == crypto.AES.decrypt(hash, CONFIG.salt).toString(crypto.enc.Utf8)
  );
}

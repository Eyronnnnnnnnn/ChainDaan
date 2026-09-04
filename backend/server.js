import "dotenv/config";
import { promisify } from "node:util";
import crypto from "node:crypto";
import dns from "node:dns";
import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import multer from "multer";
import nodemailer from "nodemailer";
import { v2 as cloudinary } from "cloudinary";
import { Server as SocketServer } from "socket.io";
import { env } from "./config/env.js";

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: { origin: env.clientOrigin },
});
const port = env.port;
const mongoUri = env.mongoUri;
const scrypt = promisify(crypto.scrypt);
const authSecret = env.authSecret;
const mailer = env.smtpHost && env.smtpUser && env.smtpPassword && env.mailFrom
  ? nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: { user: env.smtpUser, pass: env.smtpPassword },
    })
  : null;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    callback(
      null,
      ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype),
    );
  },
});

dns.setServers(["1.1.1.1", "8.8.8.8"]);

app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());

app.get("/", (_request, response) =>
  response.json({
    name: "Chain Daan API",
    status: "running",
    health: "/api/health",
  }),
);

const profileSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["business", "supplier"],
      required: true,
      index: true,
    },
    fullName: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    facebookId: { type: String, unique: true, sparse: true, index: true },
    googleId: { type: String, unique: true, sparse: true, index: true },
    passwordHash: { type: String, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    phone: String,
    town: { type: String, index: true },
    about: String,
    category: String,
    deliveryInfo: String,
    minimumOrder: String,
    businessHours: String,
    profilePhotoUrl: String,
  },
  { timestamps: true },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    category: { type: String, index: true },
    price: { type: Number, min: 0 },
    stock: { type: Number, min: 0, default: 0 },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
      index: true,
    },
    images: { type: [String], default: [] },
  },
  { timestamps: true },
);

const conversationSchema = new mongoose.Schema(
  {
    participantIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
    ],
    lastMessageAt: Date,
  },
  { timestamps: true },
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    text: { type: String, required: true, trim: true },
    readAt: Date,
  },
  { timestamps: true },
);

const saleSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
      index: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true, min: 0 },
    deliveryAddress: { type: String, trim: true },
    deliveryTown: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    notes: { type: String, trim: true },
    paymentMethod: { type: String, default: "Cash on Delivery (COD)" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    soldAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

const feedbackSchema = new mongoose.Schema(
  {
    developerEmail: { type: String, required: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const Profile = mongoose.model("Profile", profileSchema);
const Product = mongoose.model("Product", productSchema);
const Conversation = mongoose.model("Conversation", conversationSchema);
const Message = mongoose.model("Message", messageSchema);
const Sale = mongoose.model("Sale", saleSchema);
const Feedback = mongoose.model("Feedback", feedbackSchema);
const onlineUsers = new Map();

const asyncRoute = (handler) => (request, response, next) =>
  Promise.resolve(handler(request, response, next)).catch(next);

const publicProfile = (profile) => {
  const data = profile.toObject ? profile.toObject() : { ...profile };
  delete data.passwordHash;
  return data;
};

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  const [salt, key] = storedHash.split(":");
  const derivedKey = await scrypt(password, salt, 64);
  const expected = Buffer.from(key, "hex");
  return (
    expected.length === derivedKey.length &&
    crypto.timingSafeEqual(expected, derivedKey)
  );
}

function uploadToCloudinary(file, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => (error ? reject(error) : resolve(result.secure_url)),
    );
    stream.end(file.buffer);
  });
}

function createToken(profile) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: profile._id.toString(),
      role: profile.role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    }),
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", authSecret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

function createOAuthState({ role, intent }) {
  const payload = Buffer.from(
    JSON.stringify({
      role,
      intent,
      exp: Date.now() + 1000 * 60 * 10,
      nonce: crypto.randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", authSecret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

function readOAuthState(state) {
  const [payload, signature] = (state || "").split(".");
  if (!payload || !signature) return null;
  const expected = crypto
    .createHmac("sha256", authSecret)
    .update(payload)
    .digest("base64url");
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.exp > Date.now() && ["business", "supplier"].includes(data.role)
      ? data
      : null;
  } catch {
    return null;
  }
}

function oauthFailure(response, message) {
  response.redirect(
    `${env.clientOrigin}/oauth/callback?oauthError=${encodeURIComponent(message)}`,
  );
}

function getTokenProfileFromToken(token) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expectedSignature = crypto
    .createHmac("sha256", authSecret)
    .update(payload)
    .digest("base64url");
  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    )
  )
    return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

function getTokenProfile(request) {
  const token = request.headers.authorization?.startsWith("Bearer ")
    ? request.headers.authorization.slice(7)
    : "";
  return getTokenProfileFromToken(token);
}

const requireAuth = asyncRoute(async (request, response, next) => {
  const tokenProfile = getTokenProfile(request);
  if (!tokenProfile)
    return response.status(401).json({ error: "Authentication required." });
  request.auth = tokenProfile;
  return next();
});

app.get("/api/health", (_request, response) =>
  response.json({
    ok: true,
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  }),
);
app.post(
  "/api/feedback",
  asyncRoute(async (request, response) => {
    const { name, email, message } = request.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return response.status(400).json({ error: "Name, email, and feedback are required." });
    }
    const feedback = await Feedback.create({
      developerEmail: "aaronguillermo.dev@gmail.com",
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });
    response.status(201).json({ id: feedback._id, message: "Feedback received." });
  }),
);
app.post(
  "/api/auth/register",
  asyncRoute(async (request, response) => {
    const {
      role,
      fullName,
      name,
      email,
      phone,
      town,
      category,
      password,
      confirmPassword,
    } = request.body;
    if (
      !["business", "supplier"].includes(role) ||
      !fullName?.trim() ||
      !name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !town?.trim() ||
      !password
    )
      return response
        .status(400)
        .json({ error: "Complete all required fields." });
    if (password.length < 8)
      return response
        .status(400)
        .json({ error: "Password must be at least 8 characters." });
    if (password !== confirmPassword)
      return response.status(400).json({ error: "Passwords do not match." });
    if (await Profile.exists({ email: email.trim().toLowerCase() }))
      return response
        .status(409)
        .json({ error: "An account with this email already exists." });
    const profile = await Profile.create({
      role,
      fullName: fullName.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      town: town.trim(),
      category: category?.trim(),
      passwordHash: await hashPassword(password),
    });
    response
      .status(201)
      .json({ token: createToken(profile), user: publicProfile(profile) });
  }),
);
app.post(
  "/api/auth/login",
  asyncRoute(async (request, response) => {
    const { email, password, role } = request.body;
    const profile = await Profile.findOne({
      email: email?.trim().toLowerCase(),
      ...(role ? { role } : {}),
    }).select("+passwordHash");
    if (
      !profile ||
      !(await verifyPassword(password || "", profile.passwordHash))
    )
      return response
        .status(401)
        .json({ error: "Invalid email, password, or account type." });
    response.json({
      token: createToken(profile),
      user: publicProfile(profile),
    });
  }),
);
app.post(
  "/api/auth/forgot-password",
  asyncRoute(async (request, response) => {
    const email = request.body.email?.trim().toLowerCase();
    if (!email) return response.status(400).json({ error: "Enter your email address." });
    if (!mailer)
      return response.status(503).json({
        error: "Password reset email is not configured yet. Contact support for help.",
      });

    const profile = await Profile.findOne({ email }).select("+passwordResetTokenHash +passwordResetExpiresAt");
    if (profile) {
      const token = crypto.randomBytes(32).toString("hex");
      profile.passwordResetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
      profile.passwordResetExpiresAt = new Date(Date.now() + 1000 * 60 * 60);
      await profile.save();
      const resetUrl = new URL(`${env.clientOrigin}/reset-password`);
      resetUrl.searchParams.set("token", token);
      try {
        await mailer.sendMail({
          from: env.mailFrom,
          to: profile.email,
          subject: "Reset your Chain Daan password",
          text: `We received a request to reset your Chain Daan password. Reset it within one hour: ${resetUrl}`,
          html: `<p>We received a request to reset your Chain Daan password.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in one hour. If you did not request it, you can ignore this email.</p>`,
        });
      } catch (error) {
        profile.passwordResetTokenHash = undefined;
        profile.passwordResetExpiresAt = undefined;
        await profile.save();
        console.error("Password reset email failed:", error.message);
        return response.status(503).json({ error: "We could not send the reset email. Please try again later." });
      }
    }
    response.json({ message: "If an account matches that email, a password reset link has been sent." });
  }),
);
app.post(
  "/api/auth/reset-password",
  asyncRoute(async (request, response) => {
    const { token, password, confirmPassword } = request.body;
    if (!token || !password || !confirmPassword)
      return response.status(400).json({ error: "Complete all required fields." });
    if (password.length < 8)
      return response.status(400).json({ error: "Password must be at least 8 characters." });
    if (password !== confirmPassword)
      return response.status(400).json({ error: "Passwords do not match." });
    const passwordResetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const profile = await Profile.findOne({
      passwordResetTokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select("+passwordResetTokenHash +passwordResetExpiresAt");
    if (!profile)
      return response.status(400).json({ error: "This password reset link is invalid or has expired." });
    profile.passwordHash = await hashPassword(password);
    profile.passwordResetTokenHash = undefined;
    profile.passwordResetExpiresAt = undefined;
    await profile.save();
    response.json({ message: "Your password has been reset. You can now sign in." });
  }),
);
app.get("/api/auth/google", (request, response) => {
  if (!env.googleClientId || !env.googleClientSecret)
    return response.status(503).json({
      error: "Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the API environment.",
    });
  const role = request.query.role;
  const intent = request.query.intent;
  if (!["business", "supplier"].includes(role) || !["signin", "signup"].includes(intent))
    return response.status(400).json({ error: "Invalid Google sign-in request." });
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.search = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: env.googleRedirectUri,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state: createOAuthState({ role, intent }),
  });
  response.redirect(authorizationUrl.toString());
});
app.get(
  "/api/auth/google/callback",
  asyncRoute(async (request, response) => {
    const state = readOAuthState(request.query.state);
    if (!state) return oauthFailure(response, "Google sign-in expired. Please try again.");
    if (request.query.error)
      return oauthFailure(response, "Google sign-in was cancelled or not authorized.");
    if (!request.query.code)
      return oauthFailure(response, "Google did not return an authorization code.");

    const tokenResult = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: request.query.code,
        client_id: env.googleClientId,
        client_secret: env.googleClientSecret,
        redirect_uri: env.googleRedirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenResult.json();
    if (!tokenResult.ok || !tokenData.access_token)
      return oauthFailure(response, "Google sign-in could not be completed. Please try again.");

    const profileResult = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleProfile = await profileResult.json();
    if (!profileResult.ok || !googleProfile.sub || !googleProfile.email || googleProfile.email_verified === false)
      return oauthFailure(response, "Google must share a verified email address to sign in.");

    const email = googleProfile.email.trim().toLowerCase();
    let profile = await Profile.findOne({
      $or: [{ googleId: googleProfile.sub }, { email }],
    });
    if (!profile && state.intent === "signin")
      return oauthFailure(response, "No Chain Daan account is linked to this Google account. Create an account first.");
    if (!profile) {
      profile = await Profile.create({
        role: state.role,
        fullName: googleProfile.name?.trim() || email,
        name: googleProfile.name?.trim() || email,
        email,
        googleId: googleProfile.sub,
      });
    } else if (!profile.googleId) {
      profile.googleId = googleProfile.sub;
      await profile.save();
    }
    const redirectUrl = new URL(`${env.clientOrigin}/oauth/callback`);
    redirectUrl.searchParams.set("oauthToken", createToken(profile));
    redirectUrl.searchParams.set("oauthUser", Buffer.from(JSON.stringify(publicProfile(profile))).toString("base64url"));
    response.redirect(redirectUrl.toString());
  }),
);
app.get("/api/auth/facebook", (request, response) => {
  if (!env.facebookAppId || !env.facebookAppSecret)
    return response.status(503).json({
      error: "Facebook sign-in is not configured. Add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to the API environment.",
    });
  const role = request.query.role;
  const intent = request.query.intent;
  if (!['business', 'supplier'].includes(role) || !['signin', 'signup'].includes(intent))
    return response.status(400).json({ error: "Invalid Facebook sign-in request." });
  const authorizationUrl = new URL("https://www.facebook.com/v22.0/dialog/oauth");
  authorizationUrl.search = new URLSearchParams({
    client_id: env.facebookAppId,
    redirect_uri: env.facebookRedirectUri,
    response_type: "code",
    scope: "email,public_profile",
    state: createOAuthState({ role, intent }),
  });
  response.redirect(authorizationUrl.toString());
});
app.get(
  "/api/auth/facebook/callback",
  asyncRoute(async (request, response) => {
    const state = readOAuthState(request.query.state);
    if (!state) return oauthFailure(response, "Facebook sign-in expired. Please try again.");
    if (request.query.error)
      return oauthFailure(response, "Facebook sign-in was cancelled or not authorized.");
    if (!request.query.code)
      return oauthFailure(response, "Facebook did not return an authorization code.");

    const tokenUrl = new URL("https://graph.facebook.com/v22.0/oauth/access_token");
    tokenUrl.search = new URLSearchParams({
      client_id: env.facebookAppId,
      client_secret: env.facebookAppSecret,
      redirect_uri: env.facebookRedirectUri,
      code: request.query.code,
    });
    const tokenResult = await fetch(tokenUrl);
    const tokenData = await tokenResult.json();
    if (!tokenResult.ok || !tokenData.access_token)
      return oauthFailure(response, "Facebook sign-in could not be completed. Please try again.");

    const profileUrl = new URL("https://graph.facebook.com/me");
    profileUrl.search = new URLSearchParams({
      fields: "id,name,email",
      access_token: tokenData.access_token,
    });
    const profileResult = await fetch(profileUrl);
    const facebookProfile = await profileResult.json();
    if (!profileResult.ok || !facebookProfile.id || !facebookProfile.email)
      return oauthFailure(response, "Facebook must share your name and email address to sign in.");

    const email = facebookProfile.email.trim().toLowerCase();
    let profile = await Profile.findOne({
      $or: [{ facebookId: facebookProfile.id }, { email }],
    });
    if (!profile && state.intent === "signin")
      return oauthFailure(response, "No Chain Daan account is linked to this Facebook account. Create an account first.");
    if (!profile) {
      profile = await Profile.create({
        role: state.role,
        fullName: facebookProfile.name?.trim() || email,
        name: facebookProfile.name?.trim() || email,
        email,
        facebookId: facebookProfile.id,
      });
    } else if (!profile.facebookId) {
      profile.facebookId = facebookProfile.id;
      await profile.save();
    }
    const redirectUrl = new URL(`${env.clientOrigin}/oauth/callback`);
    redirectUrl.searchParams.set("oauthToken", createToken(profile));
    redirectUrl.searchParams.set("oauthUser", Buffer.from(JSON.stringify(publicProfile(profile))).toString("base64url"));
    response.redirect(redirectUrl.toString());
  }),
);
app.get(
  "/api/auth/me",
  requireAuth,
  asyncRoute(async (request, response) =>
    response.json(publicProfile(await Profile.findById(request.auth.sub))),
  ),
);
app.delete(
  "/api/auth/account",
  requireAuth,
  asyncRoute(async (request, response) => {
    if (request.body?.confirmation !== "Delete My Account")
      return response.status(400).json({
        error: 'Enter "Delete My Account" to permanently delete your account.',
      });

    const profileId = new mongoose.Types.ObjectId(request.auth.sub);
    const products = await Product.find({ supplierId: profileId }).select("_id");
    const productIds = products.map((product) => product._id);
    const conversations = await Conversation.find({ participantIds: profileId }).select("_id");
    const conversationIds = conversations.map((conversation) => conversation._id);

    await Message.deleteMany({
      $or: [
        { senderId: profileId },
        { recipientId: profileId },
        ...(conversationIds.length ? [{ conversationId: { $in: conversationIds } }] : []),
      ],
    });
    if (conversationIds.length)
      await Conversation.deleteMany({ _id: { $in: conversationIds } });
    await Sale.deleteMany({
      $or: [
        { supplierId: profileId },
        { buyerId: profileId },
        ...(productIds.length ? [{ productId: { $in: productIds } }] : []),
      ],
    });
    await Product.deleteMany({ supplierId: profileId });
    const deletedProfile = await Profile.findByIdAndDelete(profileId);
    if (!deletedProfile)
      return response.status(404).json({ error: "Account not found." });

    onlineUsers.delete(request.auth.sub);
    io.emit("presence:update", { userId: request.auth.sub, online: false });
    response.status(204).end();
  }),
);
app.get(
  "/api/profiles",
  requireAuth,
  asyncRoute(async (request, response) => {
    const filter = request.query.role ? { role: request.query.role } : {};
    response.json(
      (await Profile.find(filter).sort({ createdAt: -1 })).map(publicProfile),
    );
  }),
);
app.get(
  "/api/suppliers",
  requireAuth,
  asyncRoute(async (request, response) => {
    const search = request.query.search?.trim();
    const town = request.query.town?.trim();
    const profileFilter = { role: "supplier" };
    if (town && town !== "All towns") profileFilter.town = town;
    if (search) {
      const expression = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      const matchingProducts = await Product.find({
        $or: [{ name: expression }, { category: expression }],
      }).select("supplierId");
      profileFilter.$or = [
        { name: expression },
        { email: expression },
        { town: expression },
        { category: expression },
        { _id: { $in: matchingProducts.map((product) => product.supplierId) } },
      ];
    }
    const suppliers = await Profile.find(profileFilter).sort({ name: 1 });
    const products = await Product.find({
      supplierId: { $in: suppliers.map((supplier) => supplier._id) },
    }).sort({ name: 1 });
    response.json(
      suppliers.map((supplier) => ({
        ...publicProfile(supplier),
        products: products
          .filter((product) => product.supplierId.equals(supplier._id))
          .map((product) => ({
            _id: product._id,
            name: product.name,
            category: product.category,
            price: product.price,
            stock: product.stock,
            images: product.images,
          })),
      })),
    );
  }),
);
app.post(
  "/api/profiles",
  requireAuth,
  asyncRoute(async (request, response) =>
    response
      .status(201)
      .json(publicProfile(await Profile.create(request.body))),
  ),
);
app.patch(
  "/api/profiles/:id",
  requireAuth,
  asyncRoute(async (request, response) => {
    if (request.params.id !== request.auth.sub)
      return response
        .status(403)
        .json({ error: "You can only update your own profile." });
    const allowedFields = [
      "fullName",
      "name",
      "email",
      "phone",
      "town",
      "about",
      "category",
      "deliveryInfo",
      "minimumOrder",
      "businessHours",
    ];
    const updates = Object.fromEntries(
      Object.entries(request.body).filter(([field]) =>
        allowedFields.includes(field),
      ),
    );
    const profile = await Profile.findByIdAndUpdate(
      request.params.id,
      updates,
      { new: true, runValidators: true },
    );
    if (!profile)
      return response.status(404).json({ error: "Profile not found." });
    response.json(publicProfile(profile));
  }),
);
app.post(
  "/api/profiles/:id/photo",
  requireAuth,
  upload.single("photo"),
  asyncRoute(async (request, response) => {
    if (request.params.id !== request.auth.sub)
      return response
        .status(403)
        .json({ error: "You can only update your own profile." });
    if (!request.file)
      return response
        .status(400)
        .json({ error: "Choose a JPG, PNG, or WEBP image up to 5 MB." });
    const profilePhotoUrl = await uploadToCloudinary(
      request.file,
      "chaindaan/profiles",
    );
    const profile = await Profile.findByIdAndUpdate(
      request.params.id,
      { profilePhotoUrl },
      { new: true, runValidators: true },
    );
    if (!profile)
      return response.status(404).json({ error: "Profile not found." });
    response.json(publicProfile(profile));
  }),
);
app.get(
  "/api/products",
  asyncRoute(async (request, response) => {
    const filter = {};
    if (request.query.search)
      filter.name = new RegExp(request.query.search, "i");
    if (request.query.category) filter.category = request.query.category;
    response.json(await Product.find(filter).populate("supplierId"));
  }),
);
app.post(
  "/api/products",
  requireAuth,
  upload.array("images", 10),
  asyncRoute(async (request, response) => {
    if (request.auth.role !== "supplier")
      return response
        .status(403)
        .json({ error: "Only suppliers can add products." });
    const { name, category, price, stock } = request.body;
    if (!name?.trim() || price === undefined || stock === undefined)
      return response
        .status(400)
        .json({ error: "Product name, price, and stock are required." });
    const images = await Promise.all(
      (request.files || []).map((file) =>
        uploadToCloudinary(file, "chaindaan/products"),
      ),
    );
    const product = await Product.create({
      name: name.trim(),
      category: category?.trim(),
      price: Number(price),
      stock: Number(stock),
      supplierId: request.auth.sub,
      images,
    });
    response.status(201).json(product);
  }),
);
app.patch(
  "/api/products/:id",
  requireAuth,
  asyncRoute(async (request, response) => {
    const product = await Product.findOne({
      _id: request.params.id,
      supplierId: request.auth.sub,
    });
    if (!product)
      return response.status(404).json({ error: "Product not found." });
    const updates = Object.fromEntries(
      Object.entries(request.body).filter(([field]) =>
        ["name", "category", "price", "stock"].includes(field),
      ),
    );
    response.json(
      await Product.findByIdAndUpdate(product._id, updates, {
        new: true,
        runValidators: true,
      }),
    );
  }),
);
app.delete(
  "/api/products/:id",
  requireAuth,
  asyncRoute(async (request, response) => {
    const deleted = await Product.findOneAndDelete({
      _id: request.params.id,
      supplierId: request.auth.sub,
    });
    if (!deleted)
      return response.status(404).json({ error: "Product not found." });
    response.status(204).send();
  }),
);
app.get(
  "/api/conversations",
  requireAuth,
  asyncRoute(async (request, response) =>
    response.json(
      await Conversation.find({ participantIds: request.auth.sub })
        .populate("participantIds")
        .sort({ lastMessageAt: -1, updatedAt: -1 }),
    ),
  ),
);
app.post(
  "/api/conversations",
  requireAuth,
  asyncRoute(async (request, response) => {
    const participantId = request.body.participantId;
    if (!participantId || participantId === request.auth.sub)
      return response
        .status(400)
        .json({ error: "Choose another participant." });
    const participant = await Profile.findOne({
      _id: participantId,
      role: { $ne: request.auth.role },
    });
    if (!participant)
      return response.status(404).json({ error: "User not found or cannot be contacted." });
    let conversation = await Conversation.findOne({
      participantIds: { $all: [request.auth.sub, participantId] },
      $expr: { $eq: [{ $size: "$participantIds" }, 2] },
    });
    if (!conversation)
      conversation = await Conversation.create({
        participantIds: [request.auth.sub, participantId],
        lastMessageAt: new Date(),
      });
    response.status(201).json(await conversation.populate("participantIds"));
  }),
);
app.get(
  "/api/messages",
  requireAuth,
  asyncRoute(async (request, response) => {
    const conversation = await Conversation.findOne({
      _id: request.query.conversationId,
      participantIds: request.auth.sub,
    });
    if (!conversation)
      return response.status(404).json({ error: "Conversation not found." });
    response.json(
      await Message.find({ conversationId: conversation._id }).sort({
        createdAt: 1,
      }),
    );
  }),
);
app.post(
  "/api/messages",
  requireAuth,
  asyncRoute(async (request, response) => {
    const { conversationId, recipientId, text } = request.body;
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participantIds: request.auth.sub,
    });
    if (
      !conversation ||
      !conversation.participantIds.some((id) => id.toString() === recipientId)
    )
      return response
        .status(403)
        .json({ error: "You are not a participant in this conversation." });
    if (!text?.trim())
      return response.status(400).json({ error: "Message cannot be empty." });
    const message = await Message.create({
      conversationId,
      senderId: request.auth.sub,
      recipientId,
      text: text.trim(),
    });
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessageAt: message.createdAt,
    });
    const result = message.toObject();
    io.to(conversationId).emit("message", result);
    response.status(201).json(result);
  }),
);
app.get(
  "/api/orders",
  requireAuth,
  asyncRoute(async (request, response) => {
    const filter = {};
    if (request.auth.role === "supplier") {
      filter.supplierId = request.auth.sub;
    } else {
      filter.buyerId = request.auth.sub;
    }
    if (request.query.status) {
      filter.status = request.query.status;
    }
    const orders = await Sale.find(filter)
      .populate("productId")
      .populate("buyerId")
      .populate("supplierId")
      .sort({ createdAt: -1 });
    response.json(orders);
  }),
);

app.post(
  "/api/orders",
  requireAuth,
  asyncRoute(async (request, response) => {
    const {
      productId,
      quantity,
      deliveryAddress,
      deliveryTown,
      contactPhone,
      notes,
      paymentMethod,
    } = request.body;

    if (!productId) {
      return response.status(400).json({ error: "Product is required." });
    }
    const numQty = Number(quantity);
    if (!numQty || numQty < 1) {
      return response.status(400).json({ error: "Quantity must be at least 1." });
    }
    if (!deliveryAddress?.trim() || !deliveryTown?.trim()) {
      return response
        .status(400)
        .json({ error: "Delivery address and municipality are required." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return response.status(404).json({ error: "Product not found." });
    }

    const total = Number(product.price || 0) * numQty;
    const order = await Sale.create({
      supplierId: product.supplierId,
      buyerId: request.auth.sub,
      productId: product._id,
      quantity: numQty,
      total,
      deliveryAddress: deliveryAddress.trim(),
      deliveryTown: deliveryTown.trim(),
      contactPhone: contactPhone?.trim() || "",
      notes: notes?.trim() || "",
      paymentMethod: paymentMethod?.trim() || "Cash on Delivery (COD)",
      status: "pending",
      soldAt: new Date(),
    });

    const populated = await Sale.findById(order._id)
      .populate("productId")
      .populate("buyerId")
      .populate("supplierId");

    io.to(product.supplierId.toString()).emit("newOrder", populated);
    response.status(201).json(populated);
  }),
);

app.patch(
  "/api/orders/:id/status",
  requireAuth,
  asyncRoute(async (request, response) => {
    const { status } = request.body;
    if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      return response.status(400).json({ error: "Invalid order status." });
    }

    const order = await Sale.findById(request.params.id);
    if (!order) {
      return response.status(404).json({ error: "Order not found." });
    }

    const isSupplier = order.supplierId.toString() === request.auth.sub;
    const isBuyer = order.buyerId.toString() === request.auth.sub;

    if (!isSupplier && !isBuyer) {
      return response.status(403).json({ error: "Unauthorized access to this order." });
    }

    if (isBuyer && !isSupplier && status !== "cancelled") {
      return response
        .status(403)
        .json({ error: "Only suppliers can confirm or complete orders." });
    }

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    if (status === "confirmed" && previousStatus !== "confirmed") {
      await Product.findByIdAndUpdate(order.productId, {
        $inc: { stock: -order.quantity },
      });
    } else if (previousStatus === "confirmed" && status === "cancelled") {
      await Product.findByIdAndUpdate(order.productId, {
        $inc: { stock: order.quantity },
      });
    }

    const populated = await Sale.findById(order._id)
      .populate("productId")
      .populate("buyerId")
      .populate("supplierId");

    io.to(order.buyerId.toString()).emit("orderUpdated", populated);
    io.to(order.supplierId.toString()).emit("orderUpdated", populated);

    response.json(populated);
  }),
);

app.get(
  "/api/sales",
  asyncRoute(async (request, response) =>
    response.json(
      await Sale.find(
        request.query.supplierId
          ? { supplierId: request.query.supplierId }
          : {},
      )
        .populate("productId buyerId")
        .sort({ soldAt: -1 }),
    ),
  ),
);
app.post(
  "/api/sales",
  asyncRoute(async (request, response) =>
    response.status(201).json(await Sale.create(request.body)),
  ),
);
app.use((error, _request, response, _next) => {
  console.error("Request failed:", error);
  if (response.headersSent) return;

  const status = error?.statusCode || error?.status || 400;
  response.status(status >= 400 && status < 600 ? status : 500).json({
    error: error?.message || "The request could not be processed.",
  });
});

if (!mongoUri) {
  console.error(
    "Missing MONGODB_URI. Add your MongoDB Atlas connection string to .env.",
  );
  process.exit(1);
}

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || "";
  const profile = getTokenProfileFromToken(token);
  if (!profile) return next(new Error("Authentication required."));
  socket.auth = profile;
  next();
});

io.on("connection", (socket) => {
  socket.join(socket.auth.sub);
  const connectionCount = onlineUsers.get(socket.auth.sub) || 0;
  onlineUsers.set(socket.auth.sub, connectionCount + 1);
  socket.emit("presence:init", [...onlineUsers.keys()]);
  io.emit("presence:update", { userId: socket.auth.sub, online: true });
  socket.on("joinConversation", (conversationId) =>
    socket.join(conversationId),
  );
  socket.on("leaveConversation", (conversationId) =>
    socket.leave(conversationId),
  );
  socket.on("typing", ({ conversationId }) => {
    socket.to(conversationId).emit("userTyping", {
      conversationId,
      userId: socket.auth.sub,
    });
  });
  socket.on("stopTyping", ({ conversationId }) => {
    socket.to(conversationId).emit("userStopTyping", {
      conversationId,
      userId: socket.auth.sub,
    });
  });
  socket.on("markSeen", async ({ conversationId }) => {
    try {
      await Message.updateMany(
        { conversationId, recipientId: socket.auth.sub, readAt: null },
        { $set: { readAt: new Date() } }
      );
      socket.to(conversationId).emit("messagesSeen", {
        conversationId,
        seenBy: socket.auth.sub,
      });
    } catch {
      // ignore
    }
  });
  socket.on("disconnect", () => {
    const remainingConnections = (onlineUsers.get(socket.auth.sub) || 1) - 1;
    if (remainingConnections > 0) {
      onlineUsers.set(socket.auth.sub, remainingConnections);
      return;
    }
    onlineUsers.delete(socket.auth.sub);
    io.emit("presence:update", { userId: socket.auth.sub, online: false });
  });
});

mongoose
  .connect(mongoUri)
  .then(() =>
    httpServer.listen(port, () =>
      console.log(`API listening on http://localhost:${port}`),
    ),
  )
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });

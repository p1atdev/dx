import { WebSocketClient, WebSocketServer } from "./deps.ts";
import { RoomRequest, RoomResponse } from "./types/mod.ts";
import { ClientUser, FrontDesk } from "./models/mod.ts";

const wss = new WebSocketServer(8080);

const desk = new FrontDesk();

const clients = new Map<string, WebSocketClient>();

wss.on("connection", function (ws: WebSocketClient) {
  ws.on("message", function (message: string) {
    console.log(message);

    const event: RoomRequest = JSON.parse(message);

    switch (event.type) {
      case "handshake": {
        // ハンドシェイクでユーザーidを与える
        console.log("[SERVER] handshake");

        const userType = event.payload.type ?? "sender";

        const user = new ClientUser(userType);

        clients.set(user.uid, ws);

        const res: RoomResponse = {
          type: event.type,
          payload: {
            userId: user.uid,
          },
        };

        ws.send(JSON.stringify(res));

        break;
      }

      case "create": {
        console.log("[SERVER] create");

        const uid = event.payload.userId;

        // 部屋を作成する
        const [room, salt] = desk.createRoom(uid);

        console.log("[SERVER] created room:", room);

        const roomEvent: RoomResponse = {
          type: event.type,
          payload: {
            roomId: room.id,
            salt: salt,
          },
        };

        ws.send(JSON.stringify(roomEvent));
        break;
      }

      case "connect": {
        console.log("[SERVER] connect");

        const uid = event.payload.userId;
        const rid = event.payload.roomId;
        const salt = event.payload.salt;

        const room = desk.getRoom(rid, salt);

        if (!room) {
          const res: RoomResponse = {
            type: "connect",
            payload: {},
          };
          ws.send(JSON.stringify(res));
          break;
        }

        room.setReceiver(uid);

        const sender = clients.get(room.sender);

        const res: RoomResponse = {
          type: "ready",
          payload: {
            roomId: room.id,
            salt: salt,
          },
        };

        sender?.send(JSON.stringify(res));
        ws.send(JSON.stringify(res));

        console.log("[SERVER] Ready!");

        break;
      }

      case "send": {
        console.log("[SERVER] received data from sender");

        const userId = event.payload.userId;
        const roomId = event.payload.roomId;
        const salt = event.payload.salt;

        const room = desk.getRoom(roomId, salt);

        console.log("[SERVER] room:", room);

        if (!room) {
          console.log("[SERVER] room not found");

          const res: RoomResponse = {
            type: "send",
            payload: {},
          };
          ws.send(JSON.stringify(res));
          break;
        }

        if (room.sender != userId) {
          console.log("[SERVER] user is not valid");

          const res: RoomResponse = {
            type: "send",
            payload: {},
          };
          ws.send(JSON.stringify(res));
          break;
        }

        const receiverId = room.receiver;

        if (!receiverId) {
          console.log("[SERVER] receiver not found");

          const res: RoomResponse = {
            type: "send",
            payload: {},
          };
          ws.send(JSON.stringify(res));
          break;
        }

        const receiver = clients.get(receiverId);

        const res: RoomResponse = {
          type: "send",
          payload: {
            ...event.payload,
          },
        };

        receiver?.send(JSON.stringify(res));
        ws.send(JSON.stringify(res));

        break;
      }

      case "stream": {
        console.log("[SERVER] stream");

        console.log("[SERVER] stream:", event.payload);

        const userId = event.payload.userId;
        const roomId = event.payload.roomId;
        const salt = event.payload.salt;

        const room = desk.getRoom(roomId, salt);

        console.log("[SERVER] room:", room);

        if (!room) {
          console.log("[SERVER] room not found");

          const res: RoomResponse = {
            type: "stream",
            payload: {},
          };
          ws.send(JSON.stringify(res));
          break;
        }

        if (room.sender != userId) {
          console.log("[SERVER] user is not valid");

          const res: RoomResponse = {
            type: "stream",
            payload: {},
          };
          ws.send(JSON.stringify(res));
          break;
        }

        const receiverId = room.receiver;

        if (!receiverId) {
          console.log("[SERVER] receiver not found");

          const res: RoomResponse = {
            type: "stream",
            payload: {},
          };
          ws.send(JSON.stringify(res));
          break;
        }

        const receiver = clients.get(receiverId);

        const res: RoomResponse = {
          type: "stream",
          payload: {
            ...event.payload,
          },
        };

        receiver?.send(JSON.stringify(res));
        ws.send(JSON.stringify(res));

        break;
      }

      default: {
        console.log("[SERVER] unknown event type:", event.type);
        ws.send("unknown event type: " + event.type);
        break;
      }
    }

    if (ws.isClosed) {
      console.log("[SERVER] ws closed!");
    }
  });

  ws.on("close", function () {
    console.log("[SERVER] ws closed!");
  });
});

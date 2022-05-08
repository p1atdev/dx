import { serve } from "./deps.ts";
import { RoomRequest, RoomResponse } from "./types/mod.ts";
import { ClientUser, FrontDesk } from "./models/mod.ts";

const desk = new FrontDesk();

const clients = new Map<string, WebSocket>();

serve((req) => {
  const upgrade = req.headers.get("upgrade") || "";

  if (upgrade.toLowerCase() != "websocket") {
    return new Response("request isn't trying to upgrade to websocket.");
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => console.log("socket opened");
  socket.onmessage = (e) => {
    const message = e.data;

    console.log("socket message:", message);

    const event: RoomRequest = JSON.parse(message);

    handleEvent(event, socket);

    // socket.send(new Date().toString());
  };

  socket.onerror = (e) => console.log("socket errored:", e);
  socket.onclose = () => console.log("socket closed");

  return response;
});

const handleEvent = (event: RoomRequest, socket: WebSocket) => {
  switch (event.type) {
    case "handshake": {
      // ハンドシェイクでユーザーidを与える
      console.log("[SERVER] handshake");

      const userType = event.payload.type ?? "sender";

      const user = new ClientUser(userType);

      clients.set(user.uid, socket);

      const res: RoomResponse = {
        type: event.type,
        payload: {
          userId: user.uid,
        },
      };

      socket.send(JSON.stringify(res));

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

      socket.send(JSON.stringify(roomEvent));
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
        socket.send(JSON.stringify(res));
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
      socket.send(JSON.stringify(res));

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
        socket.send(JSON.stringify(res));
        break;
      }

      if (room.sender != userId) {
        console.log("[SERVER] user is not valid");

        const res: RoomResponse = {
          type: "send",
          payload: {},
        };
        socket.send(JSON.stringify(res));
        break;
      }

      const receiverId = room.receiver;

      if (!receiverId) {
        console.log("[SERVER] receiver not found");

        const res: RoomResponse = {
          type: "send",
          payload: {},
        };
        socket.send(JSON.stringify(res));
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
      socket.send(JSON.stringify(res));

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
        socket.send(JSON.stringify(res));
        break;
      }

      if (room.sender != userId) {
        console.log("[SERVER] user is not valid");

        const res: RoomResponse = {
          type: "stream",
          payload: {},
        };
        socket.send(JSON.stringify(res));
        break;
      }

      const receiverId = room.receiver;

      if (!receiverId) {
        console.log("[SERVER] receiver not found");

        const res: RoomResponse = {
          type: "stream",
          payload: {},
        };
        socket.send(JSON.stringify(res));
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
      socket.send(JSON.stringify(res));

      break;
    }

    default: {
      console.log("[SERVER] unknown event type:", event.type);
      socket.send("unknown event type: " + event.type);
      break;
    }
  }
};

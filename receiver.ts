import { StandardWebSocketClient, WebSocketClient } from "./deps.ts";
import { RoomRequest, RoomResponse } from "./types/mod.ts";
import { ClientUser } from "./models/mod.ts";

const endpoint = "ws://127.0.0.1:8080";
const ws: WebSocketClient = new StandardWebSocketClient(endpoint);

const user = new ClientUser("sender");

const roomId = "279853";
const roomSalt = "172642";

ws.on("open", function () {
  console.log("[RECEIVER] ws connected!");

  const req: RoomRequest = {
    type: "handshake",
    payload: {
      type: "receiver",
    },
  };

  ws.send(JSON.stringify(req));
});

ws.on("message", function (message: MessageEvent) {
  const event: RoomResponse = JSON.parse(message.data);

  switch (event.type) {
    case "handshake": {
      console.log("[RECEIVER] handshake");

      // ハンドシェイクで取得したユーザーID
      const userId = event.payload.userId;
      user.uid = userId;

      // 接続要求
      const req: RoomRequest = {
        type: "connect",
        payload: {
          userId: userId,
          roomId: roomId,
          salt: roomSalt,
        },
      };

      console.log("[RECEIVER] req: ", req);

      ws.send(JSON.stringify(req));

      break;
    }

    case "connect": {
      // 接続要求後
      console.log("[RECEIVER] connected!");

      console.log("[RECEIVER] payload: ", event.payload);

      break;
    }

    case "send": {
      // データ受信
      console.log("[RECEIVER] data received: ", event.payload);

      break;
    }

    default: {
      console.log("[RECEIVER] unknown event type:", event.type);
      break;
    }

    case "ready": {
      // 接続完了、ストリーム待ち
      console.log("[RECEIVER] ready!");
    }
  }
});

ws.on("close", function () {
  console.log("[RECEIVER] ws closed!");
});

// ws.on(RoomEvent.roomCreate, function (roomJSON: string) {
//   const room = JSON.parse(roomJSON);
//   console.log(room);
// });

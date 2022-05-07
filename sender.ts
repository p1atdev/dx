import { StandardWebSocketClient, WebSocketClient } from "./deps.ts";
import { RoomRequest, RoomResponse } from "./types/mod.ts";
import { ClientUser, Room } from "./models/mod.ts";

const endpoint = "ws://127.0.0.1:8080";
const ws: WebSocketClient = new StandardWebSocketClient(endpoint);

const user = new ClientUser("sender");

ws.on("open", function () {
  console.log("[SENDER] ws connected!");

  const req: RoomRequest = {
    type: "handshake",
    payload: {
      type: "sender",
    },
  };

  ws.send(JSON.stringify(req));
});

ws.on("message", function (message: MessageEvent) {
  const event: RoomResponse = JSON.parse(message.data);

  // console.log("event:", event);

  switch (event.type) {
    case "handshake": {
      // ハンドシェイクで取得したユーザーID
      const userId = event.payload.userId;
      user.uid = userId;

      // send a creating room request
      const req: RoomRequest = {
        type: "create",
        payload: {
          userId: userId,
        },
      };

      console.log("[SENDER] requesting room creation...");

      ws.send(JSON.stringify(req));

      break;
    }

    case "create": {
      // 作成された部屋
      const room: Room = event.payload;

      console.log("created room:", room);

      break;
    }

    case "ready": {
      // 接続完了、ストリーム開始
      console.log("[SENDER] Ready!");

      const testData = "Hello, World!";

      const req: RoomRequest = {
        type: "send",
        payload: {
          ...event.payload,
          userId: user.uid,
          data: testData,
        },
      };

      console.log("[SENDER] sending data...");

      ws.send(JSON.stringify(req));

      break;
    }

    default: {
      console.log("[SENDER] unknown event type:", event.type);
      break;
    }
  }
});

ws.on("close", function () {
  console.log("[SENDER] ws closed!");
});

// ws.on(RoomEvent.roomCreate, function (roomJSON: string) {
//   const room = JSON.parse(roomJSON);
//   console.log(room);
// });

type RoomEventType =
  | "create"
  | "connect"
  | "disconnect"
  | "destroy"
  | "handshake"
  | "ready"
  | "send"
  | "stream"
  | "error";

export type RoomResponse = {
  type: RoomEventType;
  payload?: any;
};

export type RoomRequest = {
  type: RoomEventType;
  payload?: any;
};

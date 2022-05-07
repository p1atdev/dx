import { Room } from "./room.ts";
import { createHash } from "../deps.ts";

export class FrontDesk {
  // key is a hash of roomId and salt
  rooms = new Map<string, Room>();

  // /**
  //  * @param roomId - room id
  //  * @returns string - returns the passcode for the room
  //  */
  // getPasscode(roomId: string): string | undefined {
  //   const room = this.rooms.get(roomId);
  //   if (!room) {
  //     throw new Error("room not found");
  //   }

  //   return room;
  // }

  /**
   * create a new room
   * @param userId - sender user id
   * @returns Room - returns a new room
   */
  createRoom(userId: string): [Room, string] {
    const salt = Math.random().toString().slice(2, 8);

    console.log("salt:", salt);

    const room: Room = new Room(userId, salt);

    this.rooms.set(room.hash, room);

    return [room, salt];
  }

  getRoom(roomId: string, salt: string): Room | undefined {
    const hash = createHash("sha256").update(roomId + salt).toString();

    const room = this.rooms.get(hash);

    return room;
  }
}

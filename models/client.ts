export class ClientUser {
  // user id ( 6 digits )
  uid: string;

  // user type
  type: "sender" | "receiver";

  constructor(type: "sender" | "receiver") {
    this.uid = Math.random().toString().slice(2, 8);
    this.type = type;
  }
}

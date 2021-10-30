import * as expressLib from "express";
import * as http from "http";
import * as settings from "../settings/settings.json";
import {SettingsInterface} from "../settings/settings.interface";
import {Server} from "socket.io";
import {MessagesContainerModel} from "./MessagesContainer.model";


export class CoreServer {
    express: expressLib.Application;
    port: number;
    server: http.Server;
    settings: SettingsInterface;
    io: Server;
    messages: MessagesContainerModel[];

    constructor() {
        this.messages = [];
        this.settings = settings;
        this.express = expressLib();
        this.port = this.settings.port;
        this.server = http.createServer(this.express);
        this.io = new Server(this.server, {
            cors: {
                origin: settings.AllowedDomains,
                credentials: true
            },
            allowEIO3: true
        });
        this.server.listen(this.port);
        this.io.on("connection", socket => {
            console.log(socket.handshake.headers);
            const idHandshake = socket.id;
            const { nameRoom } = socket.handshake.query;
            let theRoom = "";
            console.log("Connected " + idHandshake);
            if (socket.handshake.headers.ci24) {
                socket.join(socket.handshake.headers.ci24);
                console.log("Join Room", socket.handshake.headers.ci24)
                theRoom = socket.handshake.headers.ci24.toString();
            } else if (nameRoom) {
                console.log("Cookies:", nameRoom)
                socket.join(nameRoom);
                theRoom = nameRoom.toString();
            }
            const messages = this.getMessagesFromRoom(theRoom);
            if (messages.length > 0) {
                console.log("Messages", messages);
                this.sendConnectMessages(messages);
            }
            socket.on("Send Notification", notification => {
                const items = notification.split(":");
                this.io.to(items[0]).emit("Data Event", notification)
                console.log("Send Message to", items[0], notification)
                this.addMessageToRoom(items[0], notification);
            })
        })

    }

    sendConnectMessages(messages: string[]) {
        let items: string[] = []
        if (messages && messages.length > 0) {
            items = messages[0].split(":")
            this.io.to(items[0]).emit("Data Reconnect", messages)
            console.log("Send Reconnect Message to", items[0], messages)
        }

    }

    getMessagesFromRoom(room: string): string[] {
        const index = this.messages.findIndex(x => x.name === room);
        if (index > -1) {
            return this.messages[index].messages;
        }
        return [];
    }

    addMessageToRoom(room: string, message: string) : void {
        const index = this.messages.findIndex(x => x.name === room);
        if (index > -1) {
            this.messages[index].messages.push(message);
            if (this.messages[index].messages.length > 3) {
                this.messages[index].messages = this.messages[index].messages.slice(1)
            }
        } else {
            const newMessageRoom: MessagesContainerModel = {
                name: room,
                messages: []
            }
            newMessageRoom.messages.push(message)
            this.messages.push(newMessageRoom);
        }
    }

    // Server error handler!!
    public onError(error: NodeJS.ErrnoException): void {
        if (error.syscall !== "listen") { throw error; }
        const bind = (typeof this.port === "string") ? "Pipe " + this.port : "Port " + this.port;
        switch (error.code) {
            case "EACCES":
                console.error(`${bind} requires elevated privileges`);
                process.exit(1);
                break;
            case "EADDRINUSE":
                console.error(`${bind} is already in use, Not creating server!!`);
                break;
            default:
                throw error;
        }
    }

    // Server listener for async purpose!!!
    public onListening(): void {
        if (this.server) {
            const address = this.server.address();
            const bind = (typeof address === "string") ? `pipe ${address}` : `port ${this.port}`;
            console.log(`Listening on ${bind} ${this.port}`);
        } else {
            console.log(`listening on ${settings.port}`)
        }
    }
}
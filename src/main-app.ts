import {CoreServer} from "./core/core-server";
import * as http from "http";

let theCore: CoreServer = null;
let server: http.Server;
initServer();

function initServer(): void {
    theCore = new CoreServer();
    server = theCore.server;
    server.on("error", theCore.onError);
    server.on("listening", theCore.onListening);
}
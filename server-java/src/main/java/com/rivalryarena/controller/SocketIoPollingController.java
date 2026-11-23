package com.rivalryarena.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Handles HTTP long-polling handshake requests from socket.io-client
 * so that any client attempting HTTP polling receives a clean 200 OK
 * and upgrades smoothly to WebSocket without "invalid Upgrade header" errors.
 */
@RestController
@CrossOrigin(origins = "*")
public class SocketIoPollingController {

    @RequestMapping(value = {"/socket.io", "/socket.io/", "/socket.io/**"}, method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<String> handleSocketIoPolling(
            @RequestParam(value = "EIO", required = false) String eio,
            @RequestParam(value = "transport", required = false) String transport) {

        String sid = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        // Standard Engine.IO v4 handshake packet
        String handshake = "0{\"sid\":\"" + sid + "\",\"upgrades\":[\"websocket\"],\"pingInterval\":25000,\"pingTimeout\":20000}";

        return ResponseEntity.ok()
                .header("Content-Type", "text/plain; charset=UTF-8")
                .header("Access-Control-Allow-Origin", "*")
                .body(handshake);
    }
}

package com.shopstock;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import java.awt.*;
import java.io.IOException;
import java.net.URI;

@SpringBootApplication
public class StockManagementApplication {

    @Value("${server.port:8080}")
    private String SERVER_PORT;

    public static void main(String[] args) {
        SpringApplication.run(StockManagementApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    void applicationReadyEvent() {
        browse("http://localhost:" + SERVER_PORT);
    }

    public static void browse(String url) {
        if (Desktop.isDesktopSupported()) {
            Desktop desktop = Desktop.getDesktop();
            try {
                desktop.browse(URI.create(url));
            } catch (IOException e) {
                System.err.println(e.getMessage());
                System.out.println("Failed to open the browser. Please open the following URL manually: " + url);
            }
        } else {
            Runtime runtime = Runtime.getRuntime();
            try {
                String os = System.getProperty("os.name").toLowerCase();
                System.out.println("Operating System: " + os);
                System.out.println("Launching browser now...");
                if (os.contains("win"))
                    runtime.exec("rundll32 url.dll,FileProtocolHandler " + url);
                else if (os.contains("mac"))
                    runtime.exec("open " + url);
                else if (os.contains("nix") || os.contains("linux"))
                    runtime.exec("xdg-open " + url);
                else
                    System.out.println("Unsupported operating system. Please open the following URL manually: " + url);
            } catch (IOException e) {
                System.err.println(e.getMessage());
                System.out.println("Failed to open the browser. Please open the following URL manually: " + url);
            }
        }
    }
}

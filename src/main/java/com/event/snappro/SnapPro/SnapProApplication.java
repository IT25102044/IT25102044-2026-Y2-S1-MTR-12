package com.event.snappro.SnapPro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SnapProApplication {

	public static void main(String[] args) {
		SpringApplication.run(SnapProApplication.class, args);
	}

}

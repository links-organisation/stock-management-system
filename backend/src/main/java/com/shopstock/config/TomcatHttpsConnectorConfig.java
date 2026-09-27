package com.shopstock.config;

import com.shopstock.service.CertificateService;
import org.apache.catalina.connector.Connector;
import org.apache.tomcat.util.net.SSLHostConfig;
import org.apache.tomcat.util.net.SSLHostConfigCertificate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TomcatHttpsConnectorConfig {

    private static final Logger log = LoggerFactory.getLogger(TomcatHttpsConnectorConfig.class);

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> httpsConnectorCustomizer(
            CertificateService certificateService,
            @Value("${application.https.enabled:true}") boolean httpsEnabled,
            @Value("${application.https.port:8443}") int httpsPort) {
        return factory -> {
            if (!httpsEnabled) {
                return;
            }
            try {
                if (!certificateService.ensureHttpsReady()) {
                    return;
                }

                Connector httpsConnector = new Connector("org.apache.coyote.http11.Http11NioProtocol");
                httpsConnector.setScheme("https");
                httpsConnector.setSecure(true);
                httpsConnector.setPort(httpsPort);
                httpsConnector.setProperty("SSLEnabled", "true");

                SSLHostConfig sslHostConfig = new SSLHostConfig();
                SSLHostConfigCertificate certificate =
                        new SSLHostConfigCertificate(sslHostConfig, SSLHostConfigCertificate.Type.RSA);
                certificate.setCertificateKeystoreFile(certificateService.getKeystorePath().toString());
                certificate.setCertificateKeystorePassword(certificateService.getKeystorePassword());
                certificate.setCertificateKeystoreType("PKCS12");
                certificate.setCertificateKeyAlias(CertificateService.ALIAS);
                sslHostConfig.addCertificate(certificate);
                httpsConnector.addSslHostConfig(sslHostConfig);

                factory.addAdditionalConnectors(httpsConnector);
            } catch (Exception e) {
                log.warn("Unable to start HTTPS connector on port {}; continuing HTTP-only.", httpsPort, e);
            }
        };
    }
}

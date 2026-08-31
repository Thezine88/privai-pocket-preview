package app.privai.pocket;

import static org.junit.Assert.assertEquals;
import org.junit.Test;

public class IncomingShareTest {
    @Test public void classifiesSupportedDocuments() {
        assertEquals(IncomingShare.Kind.DOCUMENT, IncomingShare.classify("application/pdf", "documento.pdf"));
        assertEquals(IncomingShare.Kind.DOCUMENT, IncomingShare.classify("text/plain", "nota.txt"));
        assertEquals(IncomingShare.Kind.DOCUMENT, IncomingShare.classify("application/octet-stream", "nota.md"));
    }

    @Test public void classifiesSupportedImages() {
        assertEquals(IncomingShare.Kind.IMAGE, IncomingShare.classify("image/png", "screen.png"));
        assertEquals(IncomingShare.Kind.IMAGE, IncomingShare.classify("image/jpeg", "foto.jpg"));
    }

    @Test public void rejectsUnsupportedContent() {
        assertEquals(IncomingShare.Kind.UNSUPPORTED, IncomingShare.classify("audio/mpeg", "audio.mp3"));
        assertEquals(IncomingShare.Kind.UNSUPPORTED, IncomingShare.classify(null, "archivio.zip"));
    }
}

package app.privai.pocket;

import java.util.Locale;

public final class IncomingShare {
    public enum Kind { DOCUMENT, IMAGE, UNSUPPORTED }

    private IncomingShare() {}

    public static Kind classify(String mimeType, String fileName) {
        String mime = mimeType == null ? "" : mimeType.toLowerCase(Locale.ROOT);
        String name = fileName == null ? "" : fileName.toLowerCase(Locale.ROOT);
        if (mime.startsWith("image/")) return Kind.IMAGE;
        if (mime.equals("application/pdf") || mime.startsWith("text/") || name.endsWith(".pdf") || name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".markdown")) return Kind.DOCUMENT;
        return Kind.UNSUPPORTED;
    }
}
